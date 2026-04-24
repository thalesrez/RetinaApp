import { prisma } from '@/lib/prisma'
import { PLANOS } from '@/config/constants'
import type { Plano } from '@/types'
import crypto from 'crypto'

const PAGARME_BASE = 'https://api.pagar.me/core/v5'

function authHeader(): string {
  const key = process.env.PAGARME_API_KEY ?? ''
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

async function pagarmePost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PAGARME_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pagar.me ${res.status}: ${err}`)
  }
  return res.json() as Promise<T>
}

// ============================================================
// Criar ou buscar customer no Pagar.me
// ============================================================
async function garantirCustomer(userId: string, email: string, name: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  if (user.pagarme_customer_id) return user.pagarme_customer_id

  const customer = await pagarmePost<{ id: string }>('/customers', {
    name,
    email,
    type: 'individual',
    metadata: { userId },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { pagarme_customer_id: customer.id },
  })

  return customer.id
}

// ============================================================
// Checkout PIX — pagamento único, acesso manual por período
// ============================================================
export async function criarCheckoutPix(params: {
  userId: string
  plano: Plano
  email: string
  name: string
}): Promise<{
  orderId: string
  pixQrCode: string
  pixCopyPaste: string
  expiraEm: string
}> {
  const config = PLANOS[params.plano.toUpperCase() as keyof typeof PLANOS]
  if (!config || !config.preco_centavos) throw new Error('Plano inválido para PIX.')

  const customerId = await garantirCustomer(params.userId, params.email, params.name)

  const order = await pagarmePost<{
    id: string
    charges: {
      last_transaction: {
        qr_code: string
        qr_code_url: string
        expires_at: string
      }
    }[]
  }>('/orders', {
    customer_id: customerId,
    items: [{
      amount: config.preco_centavos,
      description: config.nome,
      quantity: 1,
      code: params.plano,
    }],
    payments: [{
      payment_method: 'pix',
      pix: { expires_in: 3600 }, // 1 hora para pagar
    }],
    metadata: { userId: params.userId, plano: params.plano },
  })

  const tx = order.charges?.[0]?.last_transaction
  if (!tx) throw new Error('Erro ao gerar QR Code PIX.')

  // Salvar log de acesso (LGPD: pagamento = acesso a dados financeiros)
  await prisma.accessLog.create({
    data: {
      user_id: params.userId,
      acao: 'checkout_pix_iniciado',
    },
  })

  return {
    orderId: order.id,
    pixQrCode: tx.qr_code_url,
    pixCopyPaste: tx.qr_code,
    expiraEm: tx.expires_at,
  }
}

// ============================================================
// Checkout Cartão — assinatura recorrente via Pagar.me
// ============================================================
export async function criarSubscricao(params: {
  userId: string
  plano: Plano
  email: string
  name: string
}): Promise<{ checkoutUrl: string; subscriptionId: string }> {
  const config = PLANOS[params.plano.toUpperCase() as keyof typeof PLANOS]
  if (!config || !('pagarme_plan_id' in config) || !config.pagarme_plan_id) {
    throw new Error('Plano sem ID de recorrência configurado.')
  }

  const customerId = await garantirCustomer(params.userId, params.email, params.name)

  const sub = await pagarmePost<{ id: string; current_cycle: { payment_method: string } }>('/subscriptions', {
    plan_id: config.pagarme_plan_id,
    customer_id: customerId,
    payment_method: 'credit_card',
    metadata: { userId: params.userId, plano: params.plano },
  })

  await prisma.accessLog.create({
    data: { user_id: params.userId, acao: 'checkout_cartao_iniciado' },
  })

  // URL de checkout hospedado do Pagar.me para inserir cartão
  const checkoutUrl = `https://checkout.pagar.me/subscriptions/${sub.id}`

  return { checkoutUrl, subscriptionId: sub.id }
}

// ============================================================
// Processar webhook do Pagar.me
// ============================================================
export function verificarAssinaturaWebhook(
  rawBody: string,
  signature: string,
): boolean {
  const secret = process.env.PAGARME_WEBHOOK_SECRET ?? ''
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex'),
  )
}

export async function processarWebhook(event: {
  type: string
  data: {
    id: string
    status: string
    metadata?: { userId?: string; plano?: string }
    customer?: { metadata?: { userId?: string } }
    subscription?: { metadata?: { userId?: string; plano?: string } }
  }
}): Promise<void> {
  const { type, data } = event

  const userId =
    data.metadata?.userId ??
    data.customer?.metadata?.userId ??
    data.subscription?.metadata?.userId

  const plano = (
    data.metadata?.plano ??
    data.subscription?.metadata?.plano
  ) as Plano | undefined

  if (!userId) return

  // Pagamento PIX confirmado — ativar plano manualmente por 30 dias
  if (type === 'order.paid' && plano) {
    const expira = new Date()
    expira.setDate(expira.getDate() + (plano === 'pro_anual' ? 365 : 30))

    await prisma.user.update({
      where: { id: userId },
      data: { plano, plano_status: 'active', plano_expira: expira },
    })
    await prisma.accessLog.create({
      data: { user_id: userId, acao: 'plano_ativado_pix' },
    })
  }

  // Assinatura de cartão — pagamento bem-sucedido
  if (type === 'subscription.payment_succeeded' && plano) {
    const expira = new Date()
    expira.setDate(expira.getDate() + (plano === 'pro_anual' ? 365 : 30))

    await prisma.user.update({
      where: { id: userId },
      data: { plano, plano_status: 'active', plano_expira: expira },
    })
  }

  // Pagamento falhou — marcar como inadimplente
  if (type === 'subscription.payment_failed') {
    await prisma.user.update({
      where: { id: userId },
      data: { plano_status: 'past_due' },
    })
  }

  // Cancelamento — reverter para free
  if (type === 'subscription.canceled' || type === 'order.payment_failed') {
    await prisma.user.update({
      where: { id: userId },
      data: { plano: 'free', plano_status: 'canceled' },
    })
  }
}
