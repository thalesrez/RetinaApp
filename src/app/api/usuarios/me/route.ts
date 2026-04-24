import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/usuarios/me — soft delete (LGPD: direito ao esquecimento)
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const userId = session.user.id

  // Soft delete: nunca hard delete de usuário (CLAUDE.md)
  await prisma.user.update({
    where: { id: userId },
    data: { deleted_at: new Date() },
  })

  // Log LGPD
  await prisma.accessLog.create({
    data: { user_id: userId, acao: 'delete_account' },
  })

  return NextResponse.json({ ok: true })
}
