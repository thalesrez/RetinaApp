import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gerarComentarioStream } from '@/services/ia.service'
import { prisma } from '@/lib/prisma'
import { AIRateLimitError } from '@/types'

// POST /api/ia/comentario
// Body: { questionId: string }
// Response: text/event-stream (SSE)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { questionId } = await req.json()
  if (!questionId) {
    return NextResponse.json({ error: 'questionId é obrigatório.' }, { status: 400 })
  }

  const questao = await prisma.question.findFirst({
    where: { id: questionId, status: 'ativo', revisado: true },
  })

  if (!questao) {
    return NextResponse.json({ error: 'Questão não encontrada.' }, { status: 404 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of gerarComentarioStream(questao, session.user.id)) {
          // Formato SSE: data: {"token":"..."}\n\n
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
          )
        }
        // Evento final com gabarito
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, gabarito: questao.gabarito, referencia: questao.referencia_texto })}\n\n`
          )
        )
      } catch (err) {
        if (err instanceof AIRateLimitError) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'limite_atingido', message: `Limite diário atingido. Tente novamente amanhã.` })}\n\n`
            )
          )
        } else {
          const fallback = questao.fallback_comment ?? `Gabarito: ${questao.gabarito}.`
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ token: fallback })}\n\n`)
          )
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, gabarito: questao.gabarito })}\n\n`)
          )
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
