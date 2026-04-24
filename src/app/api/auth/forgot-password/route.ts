import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { enviarEmailResetSenha } from '@/lib/email'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 422 })
    }

    const { email } = parsed.data

    // RAZÃO: Sempre retorna sucesso independente de o e-mail existir.
    // Evita user enumeration — nunca confirmar se um e-mail está cadastrado.
    const user = await prisma.user.findUnique({
      where: { email, deleted_at: null },
      select: { id: true, name: true },
    })

    if (user) {
      // Gerar token de reset com TTL de 1 hora no Redis
      const token = crypto.randomUUID()
      await redis.setex(`reset:${token}`, 3600, user.id)

      // RAZÃO: fire-and-forget — falha de SMTP não deve revelar se o e-mail existe
      enviarEmailResetSenha(email, token).catch(console.error)
    }

    return NextResponse.json({
      message: 'Se este e-mail estiver cadastrado, você receberá instruções em breve.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao processar solicitação. Tente novamente.' },
      { status: 500 }
    )
  }
}
