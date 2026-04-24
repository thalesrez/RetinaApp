'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TEMA_LABELS } from '@/config/constants'
import type { DesempenhoCompleto, DesempenhoTema } from '@/types'

const nivelConfig = {
  forte:  { label: 'Forte',  cor: '#22c55e', variant: 'facil'  },
  medio:  { label: 'Médio',  cor: '#f59e0b', variant: 'medio'  },
  fraco:  { label: 'Fraco',  cor: '#ef4444', variant: 'dificil' },
} as const

function ProntidaoCirculo({ percentual }: { percentual: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (percentual / 100) * circ
  const cor = percentual >= 70 ? '#22c55e' : percentual >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={r} fill="none" stroke="#1e293b" strokeWidth={10} />
        <circle
          cx={64} cy={64} r={r} fill="none"
          stroke={cor} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x={64} y={64} textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize={22} fontWeight="bold">
          {percentual}%
        </text>
      </svg>
      <p className="text-sm text-slate-400 text-center">Prontidão estimada para a prova</p>
    </div>
  )
}

function TooltipCustom({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200">
      {(payload[0].value * 100).toFixed(0)}% acerto
    </div>
  )
}

export default function ProgressoPage() {
  const [desempenho, setDesempenho] = useState<DesempenhoCompleto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/desempenho')
      .then((r) => r.json())
      .then((d) => { setDesempenho(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <ProgressoSkeleton />

  if (!desempenho || desempenho.total_questoes_respondidas === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-slate-400 mb-2">Nenhum dado de desempenho ainda.</p>
        <p className="text-slate-600 text-sm">Responda questões no banco para ver seu progresso aqui.</p>
      </div>
    )
  }

  const taxaGeral = desempenho.taxa_acerto_geral
  const corGeral = taxaGeral >= 0.7 ? 'text-green-400' : taxaGeral >= 0.4 ? 'text-yellow-400' : 'text-red-400'

  // Dados para gráfico de barras por tema
  const dadosTema = desempenho.por_tema.map((t) => ({
    ...t,
    label: TEMA_LABELS[t.tema]?.split(' ').slice(0, 2).join(' ') ?? t.tema,
  }))

  // Dados para gráfico de evolução semanal
  const dadosEvolucao = desempenho.evolucao_semanal
    .filter((e) => e.total_questoes > 0)
    .map((e) => ({
      ...e,
      semanaLabel: new Date(e.semana).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    }))

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <h1 className="text-xl font-semibold text-slate-100">Meu Desempenho</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className={cn('text-3xl font-bold', corGeral)}>
            {(taxaGeral * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Taxa de acerto geral</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-3xl font-bold text-slate-100">
            {desempenho.total_questoes_respondidas}
          </p>
          <p className="text-xs text-slate-400 mt-1">Questões respondidas</p>
        </div>
      </div>

      {/* Prontidão */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex justify-center">
        <ProntidaoCirculo percentual={desempenho.prontidao.percentual} />
      </div>

      {/* Focos recomendados */}
      {desempenho.focos_recomendados.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-400 mb-2">Focos recomendados</p>
          <div className="flex flex-wrap gap-2">
            {desempenho.focos_recomendados.map((t) => (
              <Badge key={t} variant="default" className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
                {TEMA_LABELS[t] ?? t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Desempenho por tema */}
      {dadosTema.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Desempenho por Tema</h2>
          <div className="space-y-3">
            {dadosTema.map((t) => (
              <TemaBar key={t.tema} tema={t} />
            ))}
          </div>
        </div>
      )}

      {/* Evolução semanal */}
      {dadosEvolucao.length >= 2 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Evolução Semanal</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dadosEvolucao} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="semanaLabel" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TooltipCustom />} />
              <Line
                type="monotone"
                dataKey="taxa_acerto"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function TemaBar({ tema }: { tema: DesempenhoTema & { label: string } }) {
  const { cor } = nivelConfig[tema.nivel]
  const pct = Math.round(tema.taxa_acerto * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-300">{TEMA_LABELS[tema.tema] ?? tema.tema}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{tema.total} q</span>
          <span className="text-xs font-semibold" style={{ color: cor }}>{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: cor }}
        />
      </div>
    </div>
  )
}

function ProgressoSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-2">
      <Skeleton className="h-7 w-40" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
