import { prisma } from '@/lib/prisma'
import { QUESTOES, TEMAS, TEMA_PESO_PROVA, DIFICULDADE } from '@/config/constants'
import type { Tema } from '@/config/constants'
import type { QuestionPublica, TipoSimulado } from '@/types'

// Mulberry32 — PRNG rápido e determinístico para seed de simulado
function mkRng(seedStr: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i)
    h = Math.imul(h, 0x01000193) | 0
  }
  let s = h >>> 0
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 0x100000000
  }
}

function shuffleRng<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Remove gabarito para exposição pública
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
    alternativa_c: q.alternativa_c, alternativa_d: q.alternativa_d, alternativa_e: q.alternativa_e,
    tema: q.tema as Tema, subtema: q.subtema,
    dificuldade: q.dificuldade as 1 | 2 | 3,
    referencia_id: q.referencia_id, referencia_texto: q.referencia_texto,
    imagem_url: q.imagem_url,
    imagem_tipo: q.imagem_tipo as QuestionPublica['imagem_tipo'],
    imagem_legenda: q.imagem_legenda,
  }
}

const SELECT_QUESTAO = {
  id: true, enunciado: true, alternativa_a: true, alternativa_b: true,
  alternativa_c: true, alternativa_d: true, alternativa_e: true,
  tema: true, subtema: true, dificuldade: true,
  referencia_id: true, referencia_texto: true,
  imagem_url: true, imagem_tipo: true, imagem_legenda: true,
} as const

// ============================================================
// Selecionar questões por algoritmo de pontos fracos
// ============================================================
async function selecionarPontosFracos(userId: string, total: number, rng: () => number) {
  const quatorzeDiasAtras = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  // Desempenho por tema
  const respostas = await prisma.userAnswer.findMany({
    where: { user_id: userId, valida: true },
    select: { correta: true, question: { select: { tema: true } } },
  })
  const porTema = new Map<string, { acertos: number; total: number }>()
  for (const r of respostas) {
    const t = r.question.tema
    const curr = porTema.get(t) ?? { acertos: 0, total: 0 }
    porTema.set(t, { acertos: curr.acertos + (r.correta ? 1 : 0), total: curr.total + 1 })
  }
  const temasFragos = TEMAS.filter((t) => {
    const d = porTema.get(t)
    return !d || d.total < 5 || d.acertos / d.total < DIFICULDADE.THRESHOLD_DIFICIL
  })

  // IDs já respondidos recentemente (últimos 14 dias)
  const respondidosRecentes = await prisma.userAnswer.findMany({
    where: { user_id: userId, created_at: { gte: quatorzeDiasAtras } },
    select: { question_id: true },
    distinct: ['question_id'],
  })
  const respondidosIds = new Set(respondidosRecentes.map((r) => r.question_id))

  // Busca pool completo de questões ativas
  const pool = await prisma.question.findMany({
    where: { status: 'ativo', revisado: true },
    select: SELECT_QUESTAO,
  })

  // Divide pool em grupos
  const fracos = shuffleRng(
    pool.filter((q) => temasFragos.includes(q.tema as Tema)),
    rng,
  )
  const naoVistas = shuffleRng(
    pool.filter((q) => !respondidosIds.has(q.id) && !temasFragos.includes(q.tema as Tema)),
    rng,
  )
  const resto = shuffleRng(
    pool.filter((q) => !temasFragos.includes(q.tema as Tema) && respondidosIds.has(q.id)),
    rng,
  )

  // 60% fracos, 30% não vistas, 10% aleatório
  const nFracos = Math.ceil(total * QUESTOES.ALGORITMO_PESO_PONTOS_FRACOS)
  const nNaoVistas = Math.ceil(total * QUESTOES.ALGORITMO_PESO_NAO_VISTAS)
  const nResto = total - nFracos - nNaoVistas

  const selecionadas = [
    ...fracos.slice(0, nFracos),
    ...naoVistas.slice(0, nNaoVistas),
    ...resto.slice(0, Math.max(0, nResto)),
  ]

  // Preenche com qualquer questão se não tiver suficientes
  if (selecionadas.length < total) {
    const usadas = new Set(selecionadas.map((q) => q.id))
    const extras = shuffleRng(pool.filter((q) => !usadas.has(q.id)), rng)
    selecionadas.push(...extras.slice(0, total - selecionadas.length))
  }

  return shuffleRng(selecionadas.slice(0, total), rng)
}

// ============================================================
// Selecionar questões por tema(s)
// ============================================================
async function selecionarPorTema(temas: Tema[], total: number, rng: () => number) {
  const pool = await prisma.question.findMany({
    where: { status: 'ativo', revisado: true, tema: { in: temas } },
    select: SELECT_QUESTAO,
  })
  return shuffleRng(pool, rng).slice(0, total)
}

// ============================================================
// Selecionar questões distribuídas pelos pesos da prova
// ============================================================
async function selecionarProvaCompleta(total: number, rng: () => number) {
  const pool = await prisma.question.findMany({
    where: { status: 'ativo', revisado: true },
    select: SELECT_QUESTAO,
  })

  const porTema = new Map<string, typeof pool>()
  for (const q of pool) {
    const arr = porTema.get(q.tema) ?? []
    arr.push(q)
    porTema.set(q.tema, arr)
  }

  const selecionadas: typeof pool = []
  for (const tema of TEMAS) {
    const peso = TEMA_PESO_PROVA[tema] ?? 0
    const n = Math.round(total * peso)
    const disponíveis = shuffleRng(porTema.get(tema) ?? [], rng)
    selecionadas.push(...disponíveis.slice(0, n))
  }

  // Ajusta para total exato
  const final = shuffleRng(selecionadas, rng).slice(0, total)
  if (final.length < total) {
    const usadas = new Set(final.map((q) => q.id))
    const extras = shuffleRng(pool.filter((q) => !usadas.has(q.id)), rng)
    final.push(...extras.slice(0, total - final.length))
  }
  return final
}

// ============================================================
// Criar simulado
// ============================================================
export async function criarSimulado(params: {
  userId: string
  tipo: TipoSimulado
  temas?: Tema[]
  modoProva?: boolean
}) {
  const seed = `${params.userId}-${Date.now()}`
  const rng = mkRng(seed)
  const total =
    params.tipo === 'prova_completa'
      ? QUESTOES.MAX_QUESTOES_SIMULADO_COMPLETO
      : params.tipo === 'por_tema'
      ? Math.min(20, QUESTOES.MAX_QUESTOES_SIMULADO_COMPLETO)
      : 20 // pontos_fracos

  let questoes: QuestionPublica[]

  if (params.tipo === 'pontos_fracos') {
    const raw = await selecionarPontosFracos(params.userId, total, rng)
    questoes = raw.map(toPublica)
  } else if (params.tipo === 'por_tema') {
    const temas = params.temas?.length ? params.temas : TEMAS.slice()
    const raw = await selecionarPorTema(temas, total, rng)
    questoes = raw.map(toPublica)
  } else {
    const raw = await selecionarProvaCompleta(total, rng)
    questoes = raw.map(toPublica)
  }

  if (questoes.length === 0) {
    throw new Error('Nenhuma questão disponível para este simulado.')
  }

  const temas = [...new Set(questoes.map((q) => q.tema))]

  const simulado = await prisma.simuladoSession.create({
    data: {
      user_id: params.userId,
      tipo: params.tipo,
      temas,
      modo_prova: params.modoProva ?? false,
      seed,
      itens: {
        create: questoes.map((q, i) => ({
          question_id: q.id,
          ordem: i,
        })),
      },
    },
    include: {
      itens: { orderBy: { ordem: 'asc' }, include: { question: { select: SELECT_QUESTAO } } },
    },
  })

  return {
    simulado,
    questoes,
  }
}

// ============================================================
// Buscar simulado em andamento
// ============================================================
export async function buscarSimulado(simuladoId: string, userId: string) {
  const simulado = await prisma.simuladoSession.findFirstOrThrow({
    where: { id: simuladoId, user_id: userId },
    include: {
      itens: {
        orderBy: { ordem: 'asc' },
        include: { question: { select: SELECT_QUESTAO } },
      },
    },
  })

  // Respostas já dadas neste simulado
  const respostasDb = await prisma.userAnswer.findMany({
    where: { user_id: userId, simulado_id: simuladoId },
    select: { question_id: true, correta: true, resposta: true },
  })
  const respostas = new Map(respostasDb.map((r) => [r.question_id, r]))

  const questoes = simulado.itens.map((item) => toPublica(item.question))

  return { simulado, questoes, respostas }
}

// ============================================================
// Concluir simulado
// ============================================================
export async function concluirSimulado(simuladoId: string, userId: string) {
  const simulado = await prisma.simuladoSession.findFirstOrThrow({
    where: { id: simuladoId, user_id: userId },
    include: { itens: { include: { question: { select: { tema: true } } } } },
  })

  const respostas = await prisma.userAnswer.findMany({
    where: { user_id: userId, simulado_id: simuladoId, valida: true },
    select: { correta: true, question: { select: { tema: true } } },
  })

  const acertos = respostas.filter((r) => r.correta).length
  const total = respostas.length

  // Resultado por tema
  const porTema = new Map<string, { acertos: number; total: number }>()
  for (const r of respostas) {
    const t = r.question.tema
    const curr = porTema.get(t) ?? { acertos: 0, total: 0 }
    porTema.set(t, { acertos: curr.acertos + (r.correta ? 1 : 0), total: curr.total + 1 })
  }

  const iniciado = simulado.iniciado_em.getTime()
  const tempoTotalSegundos = Math.round((Date.now() - iniciado) / 1000)

  await prisma.simuladoSession.update({
    where: { id: simuladoId },
    data: {
      status: 'concluido',
      concluido_em: new Date(),
      tempo_total_segundos: tempoTotalSegundos,
    },
  })

  return {
    simuladoId,
    acertos,
    total,
    taxa_acerto: total > 0 ? acertos / total : 0,
    tempo_total_segundos: tempoTotalSegundos,
    por_tema: Array.from(porTema.entries()).map(([tema, d]) => ({
      tema,
      acertos: d.acertos,
      total: d.total,
      taxa_acerto: d.total > 0 ? d.acertos / d.total : 0,
    })),
  }
}
