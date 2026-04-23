import Redis from 'ioredis'
import { AI, RATE_LIMIT } from '@/config/constants'

// RAZÃO: Singleton global — mesma lógica do prisma.ts para evitar conexões duplicadas.
const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Verifica e incrementa o contador de chamadas IA do usuário
export async function checkAndIncrementAILimit(
  userId: string
): Promise<{ permitido: boolean; restante: number }> {
  const key = `${AI.REDIS_KEY_PREFIX_AI_CALLS}${userId}:${todayKey()}`
  const current = await redis.incr(key)

  if (current === 1) {
    // Primeiro acesso do dia — define TTL até meia-noite
    await redis.expireat(key, midnightTimestamp())
  }

  const restante = Math.max(0, AI.MAX_CALLS_PER_USER_PER_DAY - current)
  return {
    permitido: current <= AI.MAX_CALLS_PER_USER_PER_DAY,
    restante,
  }
}

// Verifica rate limiting por IP/usuário (requisições gerais)
export async function checkRateLimit(
  identifier: string
): Promise<{ permitido: boolean; restante: number }> {
  const key = `${AI.REDIS_KEY_PREFIX_RATE_LIMIT}${identifier}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, RATE_LIMIT.WINDOW_SECONDS)
  }

  const restante = Math.max(0, RATE_LIMIT.MAX_REQUESTS_PER_HOUR - current)
  return {
    permitido: current <= RATE_LIMIT.MAX_REQUESTS_PER_HOUR,
    restante,
  }
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function midnightTimestamp(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.floor(midnight.getTime() / 1000)
}
