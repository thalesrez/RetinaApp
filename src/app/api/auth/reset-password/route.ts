import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' },
        { status: 422 },
      )
    }

    const { token, password } = parsed.data
    const key = `reset:${token}`
    const userId = await redis.get(key)

    if (!userId) {
      return NextResponse.json(
        { error: 'Link expirado ou inválido. Solicite um novo e-mail de recuperação.' },
        { status: 400 },
      )
    }

    const hash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: hash },
    })

    await redis.del(key)

    return NextResponse.json({ message: 'Senha atualizada com sucesso.' })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao atualizar senha. Tente novamente.' },
      { status: 500 },
    )
  }
}
