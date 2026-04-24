import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { criarSimulado } from '@/services/simulado.service'
import { z } from 'zod'
import type { Tema } from '@/config/constants'

const schema = z.object({
  tipo: z.enum(['pontos_fracos', 'por_tema', 'prova_completa']),
  temas: z.array(z.string()).optional(),
  modoProva: z.boolean().optional(),
})

// POST /api/simulados
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  // Somente planos pro e alumni podem criar simulados personalizados
  const plano = session.user.plano
  if (plano === 'free') {
    return NextResponse.json({ error: 'Simulados disponíveis apenas no plano Pro.' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 })
  }

  try {
    const { simulado } = await criarSimulado({
      userId: session.user.id,
      tipo: parsed.data.tipo,
      temas: parsed.data.temas as Tema[] | undefined,
      modoProva: parsed.data.modoProva,
    })
    return NextResponse.json({ simuladoId: simulado.id }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar simulado.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
