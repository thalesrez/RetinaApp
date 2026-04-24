/**
 * Testes de simulados e ranking — Sprint 3
 */

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { AUTH } from '@/config/constants'

const TEST_EMAIL = `test-simulado-${Date.now()}@retinaapp.test`
const TEST_PASSWORD = 'Senha123!'
let userId: string
let questionId: string

async function cleanup() {
  await prisma.simuladoItem.deleteMany({
    where: { simulado: { user_id: userId } },
  })
  await prisma.simuladoSession.deleteMany({ where: { user_id: userId } })
  await prisma.userAnswer.deleteMany({ where: { user_id: userId } })
  await prisma.question.deleteMany({ where: { id: questionId } })
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
}

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: 'Dr. Simulado Teste',
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
      enunciado: 'Questão de teste para simulado',
      alternativa_a: 'Opção A',
      alternativa_b: 'Opção B',
      alternativa_c: 'Opção C',
      alternativa_d: 'Opção D',
      alternativa_e: 'Opção E',
      gabarito: 'A',
      tema: 'ciencia_basica',
      subtema: 'Anatomia',
      dificuldade: 2,
      fonte: 'original',
      revisado: true,
      status: 'ativo',
      fallback_comment: 'O gabarito é A.',
    },
  })
  questionId = q.id
})

afterAll(cleanup)

// ============================================================
// criarSimulado
// ============================================================

describe('criarSimulado', () => {
  it('cria simulado por_tema com questões disponíveis', async () => {
    const { criarSimulado } = await import('@/services/simulado.service')
    const { simulado, questoes } = await criarSimulado({
      userId,
      tipo: 'por_tema',
      temas: ['ciencia_basica'],
    })

    expect(simulado.id).toBeDefined()
    expect(simulado.tipo).toBe('por_tema')
    expect(simulado.status).toBe('em_andamento')
    expect(questoes.length).toBeGreaterThan(0)
    questoes.forEach((q) => {
      expect((q as unknown as Record<string, unknown>).gabarito).toBeUndefined()
    })
  })

  it('cria simulado pontos_fracos sem histórico prévio', async () => {
    const { criarSimulado } = await import('@/services/simulado.service')
    const { simulado, questoes } = await criarSimulado({
      userId,
      tipo: 'pontos_fracos',
    })

    expect(simulado.tipo).toBe('pontos_fracos')
    expect(questoes.length).toBeGreaterThan(0)
  })

  it('seed é único por simulado', async () => {
    const { criarSimulado } = await import('@/services/simulado.service')
    const { simulado: s1 } = await criarSimulado({ userId, tipo: 'por_tema', temas: ['ciencia_basica'] })
    await new Promise((r) => setTimeout(r, 5)) // garantia de timestamp diferente
    const { simulado: s2 } = await criarSimulado({ userId, tipo: 'por_tema', temas: ['ciencia_basica'] })

    expect(s1.seed).not.toBe(s2.seed)
  })
})

// ============================================================
// buscarSimulado
// ============================================================

describe('buscarSimulado', () => {
  let simuladoId: string

  beforeAll(async () => {
    const { criarSimulado } = await import('@/services/simulado.service')
    const { simulado } = await criarSimulado({ userId, tipo: 'por_tema', temas: ['ciencia_basica'] })
    simuladoId = simulado.id
  })

  it('retorna simulado com questões sem gabarito', async () => {
    const { buscarSimulado } = await import('@/services/simulado.service')
    const { simulado, questoes } = await buscarSimulado(simuladoId, userId)

    expect(simulado.id).toBe(simuladoId)
    expect(questoes.length).toBeGreaterThan(0)
    questoes.forEach((q) => {
      expect((q as unknown as Record<string, unknown>).gabarito).toBeUndefined()
    })
  })

  it('respostas map começa vazio para simulado recém-criado', async () => {
    const { buscarSimulado } = await import('@/services/simulado.service')
    const { respostas } = await buscarSimulado(simuladoId, userId)

    expect(respostas.size).toBe(0)
  })

  it('lança erro para simulado de outro usuário', async () => {
    const { buscarSimulado } = await import('@/services/simulado.service')
    await expect(buscarSimulado(simuladoId, 'outro-user-id')).rejects.toThrow()
  })
})

// ============================================================
// concluirSimulado
// ============================================================

describe('concluirSimulado', () => {
  let simuladoId: string

  beforeAll(async () => {
    const { criarSimulado } = await import('@/services/simulado.service')
    const { simulado, questoes } = await criarSimulado({ userId, tipo: 'por_tema', temas: ['ciencia_basica'] })
    simuladoId = simulado.id

    // Responde todas as questões do simulado
    const { registrarResposta } = await import('@/services/questoes.service')
    for (const q of questoes) {
      await registrarResposta({ userId, questionId: q.id, resposta: 'A', tempoMs: 5_000, simuladoId })
    }
  })

  it('conclui simulado e retorna resultado', async () => {
    const { concluirSimulado } = await import('@/services/simulado.service')
    const resultado = await concluirSimulado(simuladoId, userId)

    expect(resultado.simuladoId).toBe(simuladoId)
    expect(resultado.total).toBeGreaterThan(0)
    expect(resultado.acertos).toBeGreaterThanOrEqual(0)
    expect(resultado.taxa_acerto).toBeGreaterThanOrEqual(0)
    expect(resultado.tempo_total_segundos).toBeGreaterThan(0)
  })

  it('simulado fica com status concluido após conclusão', async () => {
    const simulado = await prisma.simuladoSession.findUnique({ where: { id: simuladoId } })
    expect(simulado?.status).toBe('concluido')
    expect(simulado?.concluido_em).not.toBeNull()
  })
})

// ============================================================
// API routes — proteção 401
// ============================================================

describe('API /api/simulados — autenticação', () => {
  it('POST /api/simulados retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/simulados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'por_tema', temas: ['ciencia_basica'] }),
    })
    expect(res.status).toBe(401)
  })

  it('GET /api/simulados/:id retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/simulados/algum-id`)
    expect(res.status).toBe(401)
  })

  it('GET /api/ranking retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/ranking`)
    expect(res.status).toBe(401)
  })

  it('GET /api/desempenho retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/desempenho`)
    expect(res.status).toBe(401)
  })

  it('POST /api/ia/tutor retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/ia/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'teste' }] }),
    })
    expect(res.status).toBe(401)
  })
})
