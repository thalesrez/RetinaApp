import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/usuarios/me/data — portabilidade de dados (LGPD Art. 18 II)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const userId = session.user.id

  const [user, respostas, simulados] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, crm: true, especialidade: true,
        estado: true, plano: true, plano_status: true, plano_expira: true,
        lgpd_consent_at: true, created_at: true,
      },
    }),
    prisma.userAnswer.findMany({
      where: { user_id: userId },
      select: {
        id: true, resposta: true, correta: true, tempo_ms: true,
        valida: true, modo: true, created_at: true,
        question: { select: { tema: true, subtema: true, dificuldade: true } },
      },
      orderBy: { created_at: 'asc' },
    }),
    prisma.simuladoSession.findMany({
      where: { user_id: userId },
      select: {
        id: true, tipo: true, temas: true, status: true, modo_prova: true,
        iniciado_em: true, concluido_em: true, tempo_total_segundos: true,
      },
      orderBy: { iniciado_em: 'asc' },
    }),
  ])

  // Log LGPD
  await prisma.accessLog.create({
    data: { user_id: userId, acao: 'export_data' },
  })

  return NextResponse.json(
    { exportado_em: new Date().toISOString(), usuario: user, respostas, simulados },
    {
      headers: {
        'Content-Disposition': `attachment; filename="retinaapp-dados-${userId}.json"`,
        'Content-Type': 'application/json',
      },
    }
  )
}
