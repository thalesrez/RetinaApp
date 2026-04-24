import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { criarCheckoutPix, criarSubscricao } from '@/services/pagamento.service'
import { z } from 'zod'
import type { Plano } from '@/types'

const schema = z.object({
  plano: z.enum(['pro_mensal', 'pro_anual', 'alumni']),
  metodo: z.enum(['pix', 'cartao']),
})

// POST /api/pagamentos/checkout
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 })
  }

  const { plano, metodo } = parsed.data

  try {
    if (metodo === 'pix') {
      const resultado = await criarCheckoutPix({
        userId: session.user.id,
        plano: plano as Plano,
        email: session.user.email,
        name: session.user.name,
      })
      return NextResponse.json({ tipo: 'pix', ...resultado })
    } else {
      const resultado = await criarSubscricao({
        userId: session.user.id,
        plano: plano as Plano,
        email: session.user.email,
        name: session.user.name,
      })
      return NextResponse.json({ tipo: 'cartao', ...resultado })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao iniciar pagamento.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
