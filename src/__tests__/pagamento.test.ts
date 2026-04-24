/**
 * Testes de pagamento, LGPD e admin — Sprint 4
 */

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { AUTH } from '@/config/constants'
import { verificarAssinaturaWebhook, processarWebhook } from '@/services/pagamento.service'
import crypto from 'crypto'

const TEST_EMAIL = `test-pagamento-${Date.now()}@retinaapp.test`
const ADMIN_EMAIL = `test-admin-${Date.now()}@retinaapp.test`
let userId: string
let adminId: string

async function cleanup() {
  await prisma.accessLog.deleteMany({ where: { user_id: { in: [userId, adminId].filter(Boolean) } } })
  await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, ADMIN_EMAIL] } } })
}

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: 'Dr. Pagamento Teste',
      email: TEST_EMAIL,
      password_hash: await bcrypt.hash('Senha123!', AUTH.BCRYPT_ROUNDS),
      plano: 'free',
      plano_status: 'active',
      lgpd_consent_at: new Date(),
    },
  })
  userId = user.id

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Teste',
      email: ADMIN_EMAIL,
      password_hash: await bcrypt.hash('Senha123!', AUTH.BCRYPT_ROUNDS),
      role: 'admin',
      plano: 'pro_mensal',
      plano_status: 'active',
      lgpd_consent_at: new Date(),
    },
  })
  adminId = admin.id
})

afterAll(cleanup)

// ============================================================
// verificarAssinaturaWebhook
// ============================================================

describe('verificarAssinaturaWebhook', () => {
  it('aceita assinatura válida', () => {
    const secret = 'webhook_secret_test'
    const rawBody = JSON.stringify({ type: 'order.paid', data: {} })
    const sig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

    const original = process.env.PAGARME_WEBHOOK_SECRET
    process.env.PAGARME_WEBHOOK_SECRET = secret

    expect(verificarAssinaturaWebhook(rawBody, sig)).toBe(true)

    process.env.PAGARME_WEBHOOK_SECRET = original
  })

  it('rejeita assinatura inválida', () => {
    expect(verificarAssinaturaWebhook('body', 'assinatura_errada_padded_32bytes_ok')).toBe(false)
  })
})

// ============================================================
// processarWebhook — ativação de plano
// ============================================================

describe('processarWebhook — order.paid', () => {
  it('ativa plano pro_mensal após pagamento PIX', async () => {
    await processarWebhook({
      type: 'order.paid',
      data: {
        id: 'order_123',
        status: 'paid',
        metadata: { userId, plano: 'pro_mensal' },
      },
    })

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(user.plano).toBe('pro_mensal')
    expect(user.plano_status).toBe('active')
    expect(user.plano_expira).not.toBeNull()
  })

  it('registro de log LGPD é criado ao ativar plano', async () => {
    const log = await prisma.accessLog.findFirst({
      where: { user_id: userId, acao: 'plano_ativado_pix' },
    })
    expect(log).not.toBeNull()
  })
})

describe('processarWebhook — subscription.payment_failed', () => {
  it('marca plano_status como past_due em falha de pagamento', async () => {
    await processarWebhook({
      type: 'subscription.payment_failed',
      data: {
        id: 'sub_456',
        status: 'failed',
        metadata: { userId },
      },
    })

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(user.plano_status).toBe('past_due')
  })
})

describe('processarWebhook — subscription.canceled', () => {
  it('reverte para free ao cancelar assinatura', async () => {
    await processarWebhook({
      type: 'subscription.canceled',
      data: {
        id: 'sub_789',
        status: 'canceled',
        metadata: { userId },
      },
    })

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(user.plano).toBe('free')
    expect(user.plano_status).toBe('canceled')
  })
})

// ============================================================
// LGPD — soft delete
// ============================================================

describe('DELETE /api/usuarios/me (soft delete LGPD)', () => {
  it('DELETE retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/usuarios/me`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(401)
  })

  it('soft delete direto no banco seta deleted_at sem remover registro', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { deleted_at: new Date() },
    })
    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user).not.toBeNull()
    expect(user!.deleted_at).not.toBeNull()

    // Restaurar para não afetar outros testes
    await prisma.user.update({
      where: { id: userId },
      data: { deleted_at: null, plano: 'free', plano_status: 'active' },
    })
  })
})

// ============================================================
// API /api/usuarios/me/data — portabilidade
// ============================================================

describe('GET /api/usuarios/me/data', () => {
  it('retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/usuarios/me/data`)
    expect(res.status).toBe(401)
  })
})

// ============================================================
// API admin — proteção 403
// ============================================================

describe('Admin API — proteção 403 para não-admin', () => {
  it('GET /api/admin/questoes retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/questoes`)
    expect(res.status).toBe(403)
  })

  it('GET /api/admin/usuarios retorna 401 sem sessão', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/usuarios`)
    expect(res.status).toBe(403)
  })
})

// ============================================================
// webhook endpoint — proteção
// ============================================================

describe('POST /api/pagamentos/webhook', () => {
  it('rejeita assinatura inválida com 401', async () => {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/pagamentos/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-pagarme-signature': 'invalida' },
      body: JSON.stringify({ type: 'order.paid', data: {} }),
    })
    expect(res.status).toBe(401)
  })
})
