import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { registrarResposta } from '@/services/questoes.service'
import { z } from 'zod'

const schema = z.object({
  resposta: z.enum(['A', 'B', 'C', 'D', 'E']),
  tempoMs: z.number().int().positive(),
  simuladoId: z.string().optional(),
  modoProva: z.boolean().optional(),
})

// POST /api/questoes/[id]/responder
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 })
  }

  try {
    const result = await registrarResposta({
      userId: session.user.id,
      questionId: params.id,
      ...parsed.data,
    })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar resposta.' }, { status: 500 })
  }
}
