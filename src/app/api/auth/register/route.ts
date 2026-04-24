import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AUTH } from '@/config/constants'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  lgpdConsent: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar a Política de Privacidade' }),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 422 }
      )
    }

    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado.' },
        { status: 409 }
      )
    }

    const password_hash = await bcrypt.hash(password, AUTH.BCRYPT_ROUNDS)
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null

    await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        plano: 'free',
        plano_status: 'active',
        lgpd_consent_at: new Date(),
        lgpd_consent_ip: ip,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    )
  }
}
