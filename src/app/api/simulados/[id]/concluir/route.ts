import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { concluirSimulado } from '@/services/simulado.service'

// POST /api/simulados/[id]/concluir
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  try {
    const resultado = await concluirSimulado(params.id, session.user.id)
    return NextResponse.json(resultado)
  } catch {
    return NextResponse.json({ error: 'Erro ao concluir simulado.' }, { status: 500 })
  }
}
