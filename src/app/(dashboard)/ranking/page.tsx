'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { RankingResult, RankingEntry } from '@/services/ranking.service'

const medalhaConfig: Record<number, { cor: string; bg: string }> = {
  1: { cor: '#f59e0b', bg: 'bg-amber-500/10' },
  2: { cor: '#94a3b8', bg: 'bg-slate-400/10' },
  3: { cor: '#b45309', bg: 'bg-amber-700/10' },
}

function RankingRow({ entry }: { entry: RankingEntry }) {
  const medalha = medalhaConfig[entry.posicao]
  const pct = Math.round(entry.taxa_acerto * 100)

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
      entry.destaque
        ? 'border-brand-500/40 bg-brand-500/5'
        : 'border-slate-800 bg-slate-900',
    )}>
      {/* Posição */}
      <div className={cn(
        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
        medalha ? medalha.bg : 'bg-slate-800',
      )}>
        {medalha
          ? <Medal className="h-4 w-4" style={{ color: medalha.cor }} />
          : <span className="text-slate-400 text-xs">{entry.posicao}</span>
        }
      </div>

      {/* Nome */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          entry.destaque ? 'text-brand-300' : 'text-slate-200',
        )}>
          {entry.nome}
          {entry.destaque && <span className="ml-2 text-xs text-brand-400">(você)</span>}
        </p>
        <p className="text-xs text-slate-500">{entry.total_questoes} questões</p>
      </div>

      {/* Taxa */}
      <div className="shrink-0 text-right">
        <p className={cn(
          'text-sm font-bold',
          pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400',
        )}>
          {pct}%
        </p>
      </div>
    </div>
  )
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [carregandoMais, setCarregandoMais] = useState(false)

  useEffect(() => {
    fetch('/api/ranking?page=1')
      .then((r) => r.json())
      .then((d) => { setRanking(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function carregarMais() {
    if (!ranking) return
    setCarregandoMais(true)
    const novaPage = page + 1
    const res = await fetch(`/api/ranking?page=${novaPage}`)
    const data: RankingResult = await res.json()
    setRanking((prev) => prev ? { ...data, top: [...prev.top, ...data.top] } : data)
    setPage(novaPage)
    setCarregandoMais(false)
  }

  if (loading) return <RankingSkeleton />

  if (!ranking || ranking.total_usuarios === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 mb-1">Ranking ainda sem dados suficientes.</p>
        <p className="text-slate-600 text-sm">Responda pelo menos 20 questões para aparecer no ranking.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Ranking</h1>
        <span className="text-sm text-slate-400">{ranking.total_usuarios} candidatos</span>
      </div>

      {/* Posição do usuário atual (destaque no topo) */}
      {ranking.posicao_usuario !== null && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 mb-6 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-brand-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-brand-300">
              Sua posição: #{ranking.posicao_usuario}
            </p>
            <p className="text-xs text-slate-400">
              Taxa de acerto: {Math.round((ranking.taxa_usuario ?? 0) * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {ranking.top.map((entry) => (
          <RankingRow key={`${entry.posicao}-${entry.nome}`} entry={entry} />
        ))}
      </div>

      {/* Carregar mais */}
      {ranking.top.length < ranking.total_usuarios && (
        <button
          onClick={carregarMais}
          disabled={carregandoMais}
          className="mt-4 w-full py-3 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          {carregandoMais ? 'Carregando…' : 'Carregar mais'}
        </button>
      )}

      <p className="mt-6 text-center text-xs text-slate-600">
        Mínimo de 20 questões válidas para participar. Respostas em menos de 3s não contam.
      </p>
    </div>
  )
}

function RankingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-3 pt-2">
      <Skeleton className="h-7 w-32 mb-4" />
      <Skeleton className="h-16 rounded-xl" />
      {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  )
}
