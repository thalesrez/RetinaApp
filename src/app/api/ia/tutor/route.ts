import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAndIncrementAILimit } from '@/lib/redis'
import { anthropic, buildSystemPrompt } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'
import { AI, SYSTEM_PROMPTS } from '@/config/constants'
import { AIRateLimitError } from '@/types'
import { z } from 'zod'

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(2000),
    })
  ).min(1).max(20),
  questaoId: z.string().optional(),
})

// POST /api/ia/tutor — SSE streaming, Pro-only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Não autorizado.' }), { status: 401 })
  }

  // Tutor IA exclusivo para planos Pro
  const plano = session.user.plano
  if (plano === 'free' || plano === 'alumni') {
    return new Response(JSON.stringify({ error: 'Tutor IA disponível apenas no plano Pro.' }), { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.errors[0].message }), { status: 422 })
  }

  const { messages, questaoId } = parsed.data
  const userId = session.user.id

  const { permitido, restante } = await checkAndIncrementAILimit(userId)
  if (!permitido) {
    const stream = new ReadableStream({
      start(controller) {
        const payload = JSON.stringify({
          error: 'limite_atingido',
          message: `Você atingiu o limite diário de ${AI.MAX_CALLS_PER_USER_PER_DAY} consultas à IA. Volte amanhã.`,
        })
        controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`))
        controller.close()
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
  }

  // Contexto da questão (se questaoId informado)
  let contextoQuestao = 'Nenhuma questão específica.'
  let temaQuestao = 'retina e vítreo'
  if (questaoId) {
    try {
      const q = await prisma.question.findFirst({
        where: { id: questaoId, status: 'ativo' },
        select: { enunciado: true, gabarito: true, tema: true, subtema: true, comentario_ia: true },
      })
      if (q) {
        contextoQuestao = `Enunciado: ${q.enunciado}\nGabarito: ${q.gabarito}\n${q.comentario_ia ? `Comentário: ${q.comentario_ia}` : ''}`
        temaQuestao = q.subtema ?? q.tema
      }
    } catch {
      // contexto não essencial — prossegue sem ele
    }
  }

  const systemPrompt = buildSystemPrompt(SYSTEM_PROMPTS.TUTOR_IA, {
    CONTEXTO_QUESTAO: contextoQuestao,
    TEMA: temaQuestao,
    TAXA_ACERTO: '—', // calculado separadamente se necessário
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI.TIMEOUT_MS)

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(streamController) {
      try {
        const stream = anthropic.messages.stream({
          model: AI.MODEL,
          max_tokens: AI.MAX_TOKENS_TUTOR,
          temperature: AI.TEMPERATURE,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        })

        for await (const event of stream) {
          if (controller.signal.aborted) break
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const payload = JSON.stringify({ token: event.delta.text })
            streamController.enqueue(encoder.encode(`data: ${payload}\n\n`))
          }
        }

        streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
      } catch {
        const payload = JSON.stringify({
          token: 'Desculpe, não consegui processar sua pergunta. Tente novamente.',
          done: true,
        })
        streamController.enqueue(encoder.encode(`data: ${payload}\n\n`))
      } finally {
        clearTimeout(timeout)
        streamController.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
