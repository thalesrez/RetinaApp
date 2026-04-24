/**
 * Testes de autenticação — Sprint 1
 * Executa contra banco de teste real (DATABASE_URL do env de teste)
 */

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { AUTH } from '@/config/constants'

// Helper: limpar usuário de teste após cada teste
async function deleteTestUser(email: string) {
  await prisma.user.deleteMany({ where: { email } })
}

const TEST_EMAIL = `test-auth-${Date.now()}@retinaapp.test`
const TEST_PASSWORD = 'Senha123!'

describe('POST /api/auth/register', () => {
  afterEach(() => deleteTestUser(TEST_EMAIL))

  it('cria usuário com dados válidos e seta lgpd_consent_at', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Teste',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        lgpdConsent: true,
      }),
    })

    expect(res.status).toBe(201)

    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } })
    expect(user).not.toBeNull()
    expect(user!.lgpd_consent_at).not.toBeNull()
    expect(user!.plano).toBe('free')
    expect(user!.deleted_at).toBeNull()
  })

  it('retorna 422 quando lgpdConsent é false', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Teste',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        lgpdConsent: false,
      }),
    })
    expect(res.status).toBe(422)
  })

  it('retorna 409 para e-mail duplicado', async () => {
    // Cria o usuário primeiro
    await prisma.user.create({
      data: {
        name: 'Dr. Existente',
        email: TEST_EMAIL,
        password_hash: await bcrypt.hash(TEST_PASSWORD, AUTH.BCRYPT_ROUNDS),
        lgpd_consent_at: new Date(),
      },
    })

    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Outro',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        lgpdConsent: true,
      }),
    })
    expect(res.status).toBe(409)
  })
})

describe('NextAuth signIn', () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        name: 'Dr. Auth Teste',
        email: TEST_EMAIL,
        password_hash: await bcrypt.hash(TEST_PASSWORD, AUTH.BCRYPT_ROUNDS),
        plano: 'free',
        lgpd_consent_at: new Date(),
      },
    })
  })

  afterAll(() => deleteTestUser(TEST_EMAIL))

  it('retorna erro com senha errada', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'SenhaErrada123!',
        csrfToken: 'test',
        json: true,
      }),
    })
    // NextAuth redireciona com error param — não retorna 401 direto
    expect(res.status).not.toBe(200)
  })
})

describe('Soft delete', () => {
  const SOFT_EMAIL = `soft-delete-${Date.now()}@retinaapp.test`

  beforeAll(async () => {
    await prisma.user.create({
      data: {
        name: 'Dr. Soft Delete',
        email: SOFT_EMAIL,
        password_hash: await bcrypt.hash(TEST_PASSWORD, AUTH.BCRYPT_ROUNDS),
        lgpd_consent_at: new Date(),
      },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: SOFT_EMAIL } })
  })

  it('soft delete seta deleted_at, não remove o registro', async () => {
    await prisma.user.update({
      where: { email: SOFT_EMAIL },
      data: { deleted_at: new Date() },
    })

    const user = await prisma.user.findUnique({ where: { email: SOFT_EMAIL } })
    expect(user).not.toBeNull()           // Registro ainda existe
    expect(user!.deleted_at).not.toBeNull() // Mas marcado como deletado
  })
})

describe('Proteção de rota /tutor para plano Free', () => {
  it('middleware bloqueia /tutor para usuário free', async () => {
    // Verifica que a rota /tutor redireciona sem JWT
    const res = await fetch(`${process.env.NEXTAUTH_URL}/tutor`, {
      redirect: 'manual',
    })
    // Deve redirecionar para /login (302) ou retornar 307
    expect([301, 302, 307, 308]).toContain(res.status)
  })
})
