import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function isAdmin(role: string) { return role === 'admin' }

// GET /api/admin/questoes?status=&page=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const status = req.nextUrl.searchParams.get('status') ?? undefined
  const page = Number(req.nextUrl.searchParams.get('page') ?? '1')
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const [questoes, total] = await Promise.all([
    prisma.question.findMany({
      where: status ? { status } : undefined,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      select: {
        id: true, enunciado: true, tema: true, subtema: true, dificuldade: true,
        status: true, revisado: true, fonte: true, created_at: true,
        _count: { select: { respostas: true } },
      },
    }),
    prisma.question.count({ where: status ? { status } : undefined }),
  ])

  return NextResponse.json({ questoes, total, page, total_pages: Math.ceil(total / pageSize) })
}

const updateSchema = z.object({
  status: z.enum(['rascunho', 'ativo', 'aposentado', 'em_revisao']).optional(),
  revisado: z.boolean().optional(),
  dificuldade: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
})

// PATCH /api/admin/questoes — bulk update ou single
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const body = await req.json()
  const { id, ids, ...fields } = body as { id?: string; ids?: string[] } & Record<string, unknown>

  const parsed = updateSchema.safeParse(fields)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 })
  }

  if (ids?.length) {
    await prisma.question.updateMany({ where: { id: { in: ids } }, data: parsed.data })
    return NextResponse.json({ updated: ids.length })
  }

  if (id) {
    const q = await prisma.question.update({ where: { id }, data: parsed.data })
    return NextResponse.json(q)
  }

  return NextResponse.json({ error: 'Nenhum id fornecido.' }, { status: 422 })
}
