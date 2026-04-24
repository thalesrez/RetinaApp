import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRanking } from '@/services/ranking.service'

// GET /api/ranking?page=1
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const page = Number(req.nextUrl.searchParams.get('page') ?? '1')

  try {
    const resultado = await getRanking({ userId: session.user.id, page })
    return NextResponse.json(resultado)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar ranking.' }, { status: 500 })
  }
}
