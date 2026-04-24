import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDesempenhoUsuario } from '@/services/questoes.service'

// GET /api/desempenho
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  try {
    const desempenho = await getDesempenhoUsuario(session.user.id)
    return NextResponse.json(desempenho)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar desempenho.' }, { status: 500 })
  }
}
