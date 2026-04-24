import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listarQuestoes } from '@/services/questoes.service'
import type { Tema } from '@/config/constants'

// GET /api/questoes?tema=&dificuldade=&comImagem=&status=&busca=&page=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const tema = searchParams.get('tema') as Tema | null
  const dificuldade = searchParams.get('dificuldade')
  const comImagem = searchParams.get('comImagem')
  const status = searchParams.get('status') as 'nao_respondida' | 'acertada' | 'errada' | null
  const busca = searchParams.get('busca')
  const page = Number(searchParams.get('page') ?? '1')

  try {
    const result = await listarQuestoes(session.user.id, {
      tema: tema ?? undefined,
      dificuldade: dificuldade ? (Number(dificuldade) as 1 | 2 | 3) : undefined,
      comImagem: comImagem === 'true' ? true : comImagem === 'false' ? false : undefined,
      status: status ?? undefined,
      busca: busca ?? undefined,
      page,
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar questões.' }, { status: 500 })
  }
}
