import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  crm: z.string().max(20).optional(),
  estado: z.string().length(2).optional(),
  horario_lembrete: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  lembrete_estudo: z.boolean().optional(),
})

// GET /api/usuarios/me/perfil
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, crm: true, especialidade: true,
      estado: true, plano: true, plano_status: true, plano_expira: true,
      created_at: true,
      notif_preferences: {
        select: { lembrete_estudo: true, horario_lembrete: true, notif_push_enabled: true },
      },
    },
  })

  await prisma.accessLog.create({
    data: { user_id: session.user.id, acao: 'view_profile' },
  })

  return NextResponse.json(user)
}

// PATCH /api/usuarios/me/perfil
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 })
  }

  const { lembrete_estudo, horario_lembrete, ...userFields } = parsed.data

  await Promise.all([
    Object.keys(userFields).length > 0
      ? prisma.user.update({ where: { id: session.user.id }, data: userFields })
      : Promise.resolve(),
    (lembrete_estudo !== undefined || horario_lembrete !== undefined)
      ? prisma.notifPreference.upsert({
          where: { user_id: session.user.id },
          create: {
            user_id: session.user.id,
            lembrete_estudo: lembrete_estudo ?? true,
            horario_lembrete: horario_lembrete ?? '20:00',
          },
          update: {
            ...(lembrete_estudo !== undefined && { lembrete_estudo }),
            ...(horario_lembrete !== undefined && { horario_lembrete }),
          },
        })
      : Promise.resolve(),
  ])

  return NextResponse.json({ ok: true })
}
