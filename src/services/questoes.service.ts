import { prisma } from '@/lib/prisma'
import { QUESTOES, DIFICULDADE } from '@/config/constants'
import type { Tema } from '@/config/constants'
import type {
  QuestionPublica,
  RespostaResult,
  DesempenhoCompleto,
  DesempenhoTema,
  EvolucaoSemanal,
  PaginatedResult,
  FiltrosQuestoes,
} from '@/types'

// Remove o gabarito — nunca exposto antes da resposta
function toPublica(q: {
  id: string; enunciado: string; alternativa_a: string; alternativa_b: string
  alternativa_c: string; alternativa_d: string; alternativa_e: string
  tema: string; subtema: string; dificuldade: number
  referencia_id: string | null; referencia_texto: string | null
  imagem_url: string | null; imagem_tipo: string | null; imagem_legenda: string | null
}): QuestionPublica {
  return {
    id: q.id, enunciado: q.enunciado,
    alternativa_a: q.alternativa_a, alternativa_b: q.alternativa_b,
    alternativa_c: q.alternativa_c, alternativa_d: q.alternativa_d,
    alternativa_e: q.alternativa_e,
    tema: q.tema as Tema, subtema: q.subtema,
    dificuldade: q.dificuldade as 1 | 2 | 3,
    referencia_id: q.referencia_id, referencia_texto: q.referencia_texto,
    imagem_url: q.imagem_url,
    imagem_tipo: q.imagem_tipo as QuestionPublica['imagem_tipo'],
    imagem_legenda: q.imagem_legenda,
  }
}

export async function listarQuestoes(
  userId: string,
  filtros: FiltrosQuestoes
): Promise<PaginatedResult<QuestionPublica & { status_usuario: 'nao_respondida' | 'acertada' | 'errada' }>> {
  const page = filtros.page ?? 1
  const skip = (page - 1) * QUESTOES.PAGINA_SIZE

  const where: Record<string, unknown> = {
    status: 'ativo',
    revisado: true,
    ...(filtros.tema && { tema: filtros.tema }),
    ...(filtros.subtema && { subtema: { contains: filtros.subtema, mode: 'insensitive' } }),
    ...(filtros.dificuldade && { dificuldade: filtros.dificuldade }),
    ...(filtros.comImagem === true && { imagem_url: { not: null } }),
    ...(filtros.busca && { enunciado: { contains: filtros.busca, mode: 'insensitive' } }),
  }

  const [questoes, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take: QUESTOES.PAGINA_SIZE,
      orderBy: { created_at: 'desc' },
      select: {
        id: true, enunciado: true, alternativa_a: true, alternativa_b: true,
        alternativa_c: true, alternativa_d: true, alternativa_e: true,
        tema: true, subtema: true, dificuldade: true,
        referencia_id: true, referencia_texto: true,
        imagem_url: true, imagem_tipo: true, imagem_legenda: true,
        respostas: {
          where: { user_id: userId, valida: true },
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { correta: true },
        },
      },
    }),
    prisma.question.count({ where }),
  ])

  // Filtro pós-query por status_usuario (não respondida / acertada / errada)
  let data = questoes.map((q) => {
    const ultimaResposta = q.respostas[0]
    const status_usuario =
      !ultimaResposta ? 'nao_respondida' :
      ultimaResposta.correta ? 'acertada' : 'errada'
    const { respostas: _, ...rest } = q
    return { ...toPublica(rest), status_usuario } as QuestionPublica & { status_usuario: 'nao_respondida' | 'acertada' | 'errada' }
  })

  if (filtros.status) {
    data = data.filter((q) => q.status_usuario === filtros.status)
  }

  return {
    data,
    total,
    page,
    page_size: QUESTOES.PAGINA_SIZE,
    total_pages: Math.ceil(total / QUESTOES.PAGINA_SIZE),
  }
}

export async function buscarQuestao(id: string): Promise<QuestionPublica> {
  const q = await prisma.question.findFirstOrThrow({
    where: { id, status: 'ativo', revisado: true },
    select: {
      id: true, enunciado: true, alternativa_a: true, alternativa_b: true,
      alternativa_c: true, alternativa_d: true, alternativa_e: true,
      tema: true, subtema: true, dificuldade: true,
      referencia_id: true, referencia_texto: true,
      imagem_url: true, imagem_tipo: true, imagem_legenda: true,
    },
  })
  return toPublica(q)
}

// Busca questão COM gabarito — uso interno após validar que o usuário já respondeu
export async function buscarQuestaoComGabarito(id: string) {
  return prisma.question.findFirstOrThrow({
    where: { id, status: 'ativo', revisado: true },
  })
}

export async function registrarResposta(params: {
  userId: string
  questionId: string
  resposta: 'A' | 'B' | 'C' | 'D' | 'E'
  tempoMs: number
  simuladoId?: string
  modoProva?: boolean
}): Promise<RespostaResult> {
  const questao = await prisma.question.findFirstOrThrow({
    where: { id: params.questionId, status: 'ativo' },
    select: { gabarito: true, fallback_comment: true, comentario_ia: true,
              referencia_texto: true, tema: true, dificuldade: true, dificuldade_real: true },
  })

  const correta = params.resposta === questao.gabarito
  // RAZÃO: valida=false quando tempo_ms < 3000 (clique acidental ou bot)
  const valida = params.tempoMs >= QUESTOES.TEMPO_MINIMO_RESPOSTA_MS

  await prisma.userAnswer.create({
    data: {
      user_id: params.userId,
      question_id: params.questionId,
      resposta: params.resposta,
      correta,
      tempo_ms: params.tempoMs,
      valida,
      simulado_id: params.simuladoId ?? null,
      modo: params.simuladoId ? 'simulado' : 'avulso',
    },
  })

  // Recalibrar dificuldade_real após MIN_RESPOSTAS_PARA_CALIBRAR respostas válidas
  const totalValidas = await prisma.userAnswer.count({
    where: { question_id: params.questionId, valida: true },
  })

  if (totalValidas >= QUESTOES.MIN_RESPOSTAS_PARA_CALIBRAR) {
    const erros = await prisma.userAnswer.count({
      where: { question_id: params.questionId, valida: true, correta: false },
    })
    const taxaErro = erros / totalValidas
    const novaDificuldade =
      taxaErro > (1 - DIFICULDADE.THRESHOLD_FACIL) ? DIFICULDADE.DIFICIL :
      taxaErro < (1 - DIFICULDADE.THRESHOLD_DIFICIL) ? DIFICULDADE.FACIL :
      DIFICULDADE.MEDIO

    await prisma.question.update({
      where: { id: params.questionId },
      data: { dificuldade_real: taxaErro, dificuldade: novaDificuldade },
    })
  }

  return {
    correta,
    gabarito: questao.gabarito as 'A' | 'B' | 'C' | 'D' | 'E',
    // null em modo_prova — sem feedback durante o simulado
    comentario: params.modoProva ? null : (questao.comentario_ia ?? questao.fallback_comment),
    referencia_texto: questao.referencia_texto,
  }
}

export async function getDesempenhoUsuario(userId: string): Promise<DesempenhoCompleto> {
  const respostas = await prisma.userAnswer.findMany({
    where: { user_id: userId, valida: true },
    select: { correta: true, created_at: true, question: { select: { tema: true } } },
    orderBy: { created_at: 'asc' },
  })

  const total = respostas.length
  const acertos = respostas.filter((r) => r.correta).length
  const taxa_acerto_geral = total > 0 ? acertos / total : 0

  // Desempenho por tema
  const porTema = new Map<string, { total: number; acertos: number }>()
  for (const r of respostas) {
    const tema = r.question.tema
    const curr = porTema.get(tema) ?? { total: 0, acertos: 0 }
    porTema.set(tema, { total: curr.total + 1, acertos: curr.acertos + (r.correta ? 1 : 0) })
  }

  const por_tema: DesempenhoTema[] = Array.from(porTema.entries()).map(([tema, d]) => {
    const taxa = d.total > 0 ? d.acertos / d.total : 0
    return {
      tema: tema as Tema,
      total: d.total,
      acertos: d.acertos,
      taxa_acerto: taxa,
      nivel: taxa >= DIFICULDADE.THRESHOLD_FACIL ? 'forte' :
             taxa >= DIFICULDADE.THRESHOLD_DIFICIL ? 'medio' : 'fraco',
    }
  })

  // Evolução semanal (últimas 8 semanas)
  const evolucao_semanal = calcularEvolucaoSemanal(respostas)

  // Prontidão: média ponderada por TEMA_PESO_PROVA
  const { TEMA_PESO_PROVA } = await import('@/config/constants')
  let prontidao = 0
  for (const d of por_tema) {
    const peso = TEMA_PESO_PROVA[d.tema] ?? 0
    prontidao += d.taxa_acerto * peso * 100
  }

  // Focos recomendados: temas com menor taxa de acerto
  const focos_recomendados = por_tema
    .filter((d) => d.nivel !== 'forte')
    .sort((a, b) => a.taxa_acerto - b.taxa_acerto)
    .slice(0, 3)
    .map((d) => d.tema)

  return {
    taxa_acerto_geral,
    total_questoes_respondidas: total,
    por_tema,
    evolucao_semanal,
    prontidao: { percentual: Math.round(prontidao), total_questoes_respondidas: total, dias_ate_prova: null },
    focos_recomendados,
  }
}

function calcularEvolucaoSemanal(
  respostas: { correta: boolean; created_at: Date }[]
): EvolucaoSemanal[] {
  const semanas = new Map<string, { total: number; acertos: number }>()
  const agora = new Date()

  for (let i = 7; i >= 0; i--) {
    const semana = new Date(agora)
    semana.setDate(agora.getDate() - i * 7)
    semana.setHours(0, 0, 0, 0)
    // Inicio da semana (segunda-feira)
    const dayOfWeek = semana.getDay()
    semana.setDate(semana.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    semanas.set(semana.toISOString().split('T')[0], { total: 0, acertos: 0 })
  }

  for (const r of respostas) {
    const d = new Date(r.created_at)
    const dayOfWeek = d.getDay()
    d.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().split('T')[0]
    const curr = semanas.get(key)
    if (curr) {
      semanas.set(key, { total: curr.total + 1, acertos: curr.acertos + (r.correta ? 1 : 0) })
    }
  }

  return Array.from(semanas.entries()).map(([semana, d]) => ({
    semana,
    taxa_acerto: d.total > 0 ? d.acertos / d.total : 0,
    total_questoes: d.total,
  }))
}
