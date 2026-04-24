import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function isAdmin(role: string) { return role === 'admin' }

// GET /api/admin/usuarios?page=&busca=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const page = Number(req.nextUrl.searchParams.get('page') ?? '1')
  const busca = req.nextUrl.searchParams.get('busca') ?? undefined
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where = busca
    ? {
        deleted_at: null,
        OR: [
          { email: { contains: busca, mode: 'insensitive' as const } },
          { name: { contains: busca, mode: 'insensitive' as const } },
        ],
      }
    : { deleted_at: null }

  const [usuarios, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' },
      select: {
        id: true, name: true, email: true, crm: true, plano: true,
        plano_status: true, plano_expira: true, role: true, created_at: true,
        _count: { select: { respostas: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  // Log LGPD: admin acessando lista de usuários
  await prisma.accessLog.create({
    data: { user_id: session.user.id, acao: 'admin_view_usuarios' },
  })

  return NextResponse.json({ usuarios, total, page, total_pages: Math.ceil(total / pageSize) })
}

const updateSchema = z.object({
  plano: z.enum(['free', 'pro_mensal', 'pro_anual', 'alumni']).optional(),
  plano_status: z.enum(['active', 'past_due', 'canceled', 'trialing']).optional(),
  role: z.enum(['user', 'admin']).optional(),
})

// PATCH /api/admin/usuarios — atualizar plano/role de um usuário
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, ...fields } = body as { userId?: string } & Record<string, unknown>
  if (!userId) return NextResponse.json({ error: 'userId obrigatório.' }, { status: 422 })

  const parsed = updateSchema.safeParse(fields)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, plano: true, plano_status: true, role: true },
  })

  await prisma.accessLog.create({
    data: { user_id: session.user.id, acao: `admin_update_usuario:${userId}` },
  })

  return NextResponse.json(updated)
}
