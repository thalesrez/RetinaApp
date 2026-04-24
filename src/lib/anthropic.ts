import Anthropic from '@anthropic-ai/sdk'
import { AI, REFERENCIAS_APROVADAS } from '@/config/constants'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Constrói a string de referências aprovadas para injeção nos prompts
export function buildReferenciasString(): string {
  return REFERENCIAS_APROVADAS.map((r) => `- ${r.ref}`).join('\n')
}

// Substitui os placeholders nos system prompts
export function buildSystemPrompt(
  template: string,
  vars: Record<string, string> = {}
): string {
  let result = template.replace('{{REFERENCIAS}}', buildReferenciasString())
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(`{{${key}}}`, value)
  }
  return result
}

// Ping leve para health check (não gera tokens)
export async function pingAnthropic(): Promise<'ok' | 'error'> {
  try {
    // Usa countTokens como ping leve — não consome créditos
    // @ts-expect-error — countTokens disponível no runtime do SDK instalado
    await anthropic.messages.countTokens({
      model: AI.MODEL,
      messages: [{ role: 'user', content: 'ping' }],
    })
    return 'ok'
  } catch {
    return 'error'
  }
}

export { AI }
