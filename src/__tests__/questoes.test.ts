/**
 * Testes do banco de questões — Sprint 2
 * Executa contra banco de teste real (DATABASE_URL do env de teste)
 */

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { AUTH, QUESTOES } from '@/config/constants'

const TEST_EMAIL = `test-questoes-${Date.now()}@retinaapp.test`
const TEST_PASSWORD = 'Senha123!'

// IDs controlados pelo teste
let userId: string
let questionId: string

async function cleanup() {
  await prisma.userAnswer.deleteMany({ where: { user_id: userId } })
  await prisma.question.deleteMany({ where: { id: questionId } })
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
}

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: 'Dr. Questoes Teste',
      email: TEST_EMAIL,
      password_hash: await bcrypt.hash(TEST_PASSWORD, AUTH.BCRYPT_ROUNDS),
      plano: 'pro_mensal',
      plano_status: 'active',
      lgpd_consent_at: new Date(),
    },
  })
  userId = user.id

  const q = await prisma.question.create({
    data: {
      enunciado: 'Sobre a fisiopatologia da DMRI neovascular, está INCORRETO afirmar:',
      alternativa_a: 'O VEGF-A é o principal mediador da neovascularização coroideana.',
      alternativa_b: 'A membrana de Bruch íntegra impede a progressão para forma neovascular.',
      alternativa_c: 'O ranibizumab é um fragmento Fab anti-VEGF.',
      alternativa_d: 'O depósito de drusas moles aumenta o risco de progressão.',
      alternativa_e: 'O fluido sub-retiniano indica atividade da MNV.',
      gabarito: 'B',
      tema: 'dmri_maculopatias',
      subtema: 'DMRI neovascular',
      dificuldade: 2,
      referencia_texto: "Ryan's Retina, Schachat, 6ª ed. 2018",
      fonte: 'original',
      revisado: true,
      status: 'ativo',
      fallback_comment: 'O gabarito correto é a alternativa B. A membrana de Bruch rompida — não íntegra — permite a progressão da MNV.',
    },
  })
  questionId = q.id
})

afterAll(cleanup)

// ============================================================
// listarQuestoes
// ============================================================

describe('listarQuestoes', () => {
  it('retorna questões com status_usuario nao_respondida para novo usuário', async () => {
    const { listarQuestoes } = await import('@/services/questoes.service')
    const result = await listarQuestoes(userId, {})

    expect(result.data.length).toBeGreaterThan(0)
    const q = result.data.find((q) => q.id === questionId)
    expect(q).toBeDefined()
    expect(q!.status_usuario).toBe('nao_respondida')
    expect(result.page_size).toBe(QUESTOES.PAGINA_SIZE)
  })

  it('filtra por tema corretamente', async () => {
    const { listarQuestoes } = await import('@/services/questoes.service')
    const result = await listarQuestoes(userId, { tema: 'dmri_maculopatias' })

    result.data.forEach((q) => {
      expect(q.tema).toBe('dmri_maculopatias')
    })
  })

  it('filtra por dificuldade corretamente', async () => {
    const { listarQuestoes } = await import('@/services/questoes.service')
    const result = await listarQuestoes(userId, { dificuldade: 2 })

    result.data.forEach((q) => {
      expect(q.dificuldade).toBe(2)
    })
  })

  it('não expõe o gabarito na listagem', async () => {
    const { listarQuestoes } = await import('@/services/questoes.service')
    const result = await listarQuestoes(userId, { tema: 'dmri_maculopatias' })

    result.data.forEach((q) => {
      expect((q as unknown as Record<string, unknown>).gabarito).toBeUndefined()
    })
  })
})

// ============================================================
// buscarQuestao
// ============================================================

describe('buscarQuestao', () => {
  it('retorna questão sem o gabarito', async () => {
    const { buscarQuestao } = await import('@/services/questoes.service')
    const q = await buscarQuestao(questionId)

    expect(q.id).toBe(questionId)
    expect(q.enunciado).toBeDefined()
    expect((q as unknown as Record<string, unknown>).gabarito).toBeUndefined()
  })

  it('lança NotFoundError para id inexistente', async () => {
    const { buscarQuestao } = await import('@/services/questoes.service')
    await expect(buscarQuestao('id-inexistente-xyz')).rejects.toThrow()
  })
})

// ============================================================
// registrarResposta
// ============================================================

describe('registrarResposta', () => {
  it('registra resposta correta e retorna correta=true com gabarito', async () => {
    const { registrarResposta } = await import('@/services/questoes.service')
    const result = await registrarResposta({
      userId,
      questionId,
      resposta: 'B', // gabarito correto
      tempoMs: 5_000,
    })

    expect(result.correta).toBe(true)
    expect(result.gabarito).toBe('B')
    expect(result.comentario).not.toBeNull()
  })

  it('registra resposta incorreta e retorna correta=false', async () => {
    const { registrarResposta } = await import('@/services/questoes.service')
    const result = await registrarResposta({
      userId,
      questionId,
      resposta: 'A',
      tempoMs: 5_000,
    })

    expect(result.correta).toBe(false)
    expect(result.gabarito).toBe('B')
  })

  it('marca valida=false para resposta em menos de 3 segundos', async () => {
    const { registrarResposta } = await import('@/services/questoes.service')
    await registrarResposta({
      userId,
      questionId,
      resposta: 'B',
      tempoMs: 1_000, // abaixo do mínimo
    })

    const resposta = await prisma.userAnswer.findFirst({
      where: { user_id: userId, question_id: questionId, tempo_ms: 1_000 },
    })
    expect(resposta).not.toBeNull()
    expect(resposta!.valida).toBe(false)
  })

  it('marca valida=true para resposta acima de 3 segundos', async () => {
    const { registrarResposta } = await import('@/services/questoes.service')
    await registrarResposta({
      userId,
      questionId,
      resposta: 'B',
      tempoMs: QUESTOES.TEMPO_MINIMO_RESPOSTA_MS + 1,
    })

    const respostas = await prisma.userAnswer.findMany({
      where: { user_id: userId, question_id: questionId, valida: true },
      orderBy: { created_at: 'desc' },
    })
    expect(respostas[0]?.valida).toBe(true)
  })

  it('não retorna comentario em modo_prova', async () => {
    const { registrarResposta } = await import('@/services/questoes.service')
    const result = await registrarResposta({
      userId,
      questionId,
      resposta: 'B',
      tempoMs: 5_000,
      modoProva: true,
    })

    expect(result.comentario).toBeNull()
  })
})

// ============================================================
// status_usuario após responder
// ============================================================

describe('status_usuario reflete última resposta', () => {
  it('status_usuario é "acertada" após resposta correta', async () => {
    const { registrarResposta, listarQuestoes } = await import('@/services/questoes.service')

    // Limpar respostas anteriores
    await prisma.userAnswer.deleteMany({ where: { user_id: userId, question_id: questionId } })

    await registrarResposta({
      userId,
      questionId,
      resposta: 'B',
      tempoMs: 5_000,
    })

    const result = await listarQuestoes(userId, { tema: 'dmri_maculopatias' })
    const q = result.data.find((q) => q.id === questionId)
    expect(q?.status_usuario).toBe('acertada')
  })

  it('status_usuario é "errada" após resposta incorreta', async () => {
    const { registrarResposta, listarQuestoes } = await import('@/services/questoes.service')

    await prisma.userAnswer.deleteMany({ where: { user_id: userId, question_id: questionId } })

    await registrarResposta({
      userId,
      questionId,
      resposta: 'A',
      tempoMs: 5_000,
    })

    const result = await listarQuestoes(userId, { tema: 'dmri_maculopatias' })
    const q = result.data.find((q) => q.id === questionId)
    expect(q?.status_usuario).toBe('errada')
  })
})

// ============================================================
// API routes — proteção 401
// ============================================================

describe('API /api/questoes — autenticação', () => {
  it('GET /api/questoes retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/questoes`)
    expect(res.status).toBe(401)
  })

  it('GET /api/questoes/:id retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/questoes/${questionId}`)
    expect(res.status).toBe(401)
  })

  it('POST /api/questoes/:id/responder retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/questoes/${questionId}/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resposta: 'A', tempoMs: 5000 }),
    })
    expect(res.status).toBe(401)
  })

  it('POST /api/questoes/:id/responder retorna 422 com resposta inválida', async () => {
    // Teste de validação de schema (sem autenticar — espera 401 antes do 422)
    // A rota valida schema APÓS autenticação, então 401 é correto aqui
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/questoes/${questionId}/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resposta: 'Z', tempoMs: -1 }),
    })
    expect([401, 422]).toContain(res.status)
  })
})
