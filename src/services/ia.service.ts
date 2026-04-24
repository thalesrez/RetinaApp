import { anthropic, buildSystemPrompt, buildReferenciasString } from '@/lib/anthropic'
import { checkAndIncrementAILimit } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { AI, SYSTEM_PROMPTS } from '@/config/constants'
import { AIRateLimitError } from '@/types'
import type { Question } from '@prisma/client'

function buildComentarioPrompt(questao: Question): string {
  return `QUESTÃO:
Enunciado: ${questao.enunciado}
A) ${questao.alternativa_a}
B) ${questao.alternativa_b}
C) ${questao.alternativa_c}
D) ${questao.alternativa_d}
E) ${questao.alternativa_e}
GABARITO: ${questao.gabarito}
Tema: ${questao.tema} → ${questao.subtema}
${questao.referencia_texto ? `Referência principal: ${questao.referencia_texto}` : ''}

Comente esta questão explicando o raciocínio clínico.`
}

// Retorna AsyncGenerator para streaming token a token
export async function* gerarComentarioStream(
  questao: Question,
  userId: string
): AsyncGenerator<string, void, unknown> {
  // CAMADA 1 — cache do banco: se já tem comentário, retorna sem chamar API
  if (questao.comentario_ia) {
    yield questao.comentario_ia
    return
  }

  // Verificar rate limit Redis ANTES de chamar API
  const { permitido, restante } = await checkAndIncrementAILimit(userId)
  if (!permitido) {
    throw new AIRateLimitError(restante)
  }

  // CAMADA 2 — API Anthropic com streaming e timeout
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI.TIMEOUT_MS)

  try {
    const stream = anthropic.messages.stream({
      model: AI.MODEL,
      max_tokens: AI.MAX_TOKENS_COMENTARIO,
      temperature: AI.TEMPERATURE,
      system: buildSystemPrompt(SYSTEM_PROMPTS.COMENTARIO_QUESTAO),
      messages: [{ role: 'user', content: buildComentarioPrompt(questao) }],
    })

    let textoCompleto = ''

    for await (const event of stream) {
      if (controller.signal.aborted) break
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        textoCompleto += event.delta.text
        yield event.delta.text
      }
    }

    // Salvar no banco após geração bem-sucedida (cache permanente)
    if (textoCompleto) {
      await prisma.question.update({
        where: { id: questao.id },
        data: { comentario_ia: textoCompleto, comentario_gerado_em: new Date() },
      })
    }
  } catch (err) {
    // CAMADA 3 — fallback offline
    const fallback =
      questao.fallback_comment ??
      `Comentário temporariamente indisponível. O gabarito correto é a alternativa ${questao.gabarito}. Tente novamente em alguns minutos.`
    yield fallback
  } finally {
    clearTimeout(timeout)
  }
}

// Versão não-streaming para uso interno (diagnóstico semanal, geração de questões)
export async function gerarTextoIA(params: {
  systemPrompt: string
  userMessage: string
  maxTokens: number
  userId: string
}): Promise<string> {
  const { permitido, restante } = await checkAndIncrementAILimit(params.userId)
  if (!permitido) throw new AIRateLimitError(restante)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI.TIMEOUT_MS)

  try {
    const msg = await anthropic.messages.create({
      model: AI.MODEL,
      max_tokens: params.maxTokens,
      temperature: AI.TEMPERATURE,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userMessage }],
    })
    const block = msg.content[0]
    return block.type === 'text' ? block.text : ''
  } catch {
    return ''
  } finally {
    clearTimeout(timeout)
  }
}

export function buildReferencias(): string {
  return buildReferenciasString()
}
