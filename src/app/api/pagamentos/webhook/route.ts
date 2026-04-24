import { NextRequest, NextResponse } from 'next/server'
import { verificarAssinaturaWebhook, processarWebhook } from '@/services/pagamento.service'

// POST /api/pagamentos/webhook
// Recebe eventos do Pagar.me (order.paid, subscription.payment_failed, etc.)
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-pagarme-signature') ?? ''

  if (!verificarAssinaturaWebhook(rawBody, signature)) {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })
  }

  try {
    const event = JSON.parse(rawBody)
    await processarWebhook(event)
    return NextResponse.json({ ok: true })
  } catch (err) {
    // RAZÃO: Não retornar stack trace ao Pagar.me — apenas 500 genérico.
    // Log do erro ficaria em Sentry (Sprint 5).
    console.error('[webhook] erro ao processar evento:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
