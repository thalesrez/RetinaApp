import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { pingAnthropic } from '@/lib/anthropic'

// GET /api/health — endpoint público para UptimeRobot
// NÃO expõe informações sensíveis (versões internas, IPs, stack traces)
export async function GET() {
  const services = {
    database: 'ok' as 'ok' | 'error',
    redis: 'ok' as 'ok' | 'error',
    anthropic: 'ok' as 'ok' | 'error',
  }

  await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`.catch(() => { services.database = 'error' }),
    redis.ping().catch(() => { services.redis = 'error' }),
    pingAnthropic().then((s) => { if (s === 'error') services.anthropic = 'error' }),
  ])

  const allOk = Object.values(services).every((s) => s === 'ok')
  const anyDown = Object.values(services).some((s) => s === 'error')

  const status = allOk ? 'ok' : anyDown ? 'degraded' : 'ok'

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      services,
      version: process.env.npm_package_version ?? '0.1.0',
    },
    { status: status === 'ok' ? 200 : 503 }
  )
}
