'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock, Archive, Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TEMA_LABELS } from '@/config/constants'
import type { Tema } from '@/config/constants'

interface QuestaoAdmin {
  id: string
  enunciado: string
  tema: string
  subtema: string
  dificuldade: number
  status: string
  revisado: boolean
  fonte: string
  created_at: string
  _count: { respostas: number }
}

const statusConfig: Record<string, { label: string; cor: string; icon: React.ElementType }> = {
  rascunho:    { label: 'Rascunho',    cor: 'text-slate-400',  icon: Clock },
  ativo:       { label: 'Ativo',       cor: 'text-green-400',  icon: CheckCircle2 },
  em_revisao:  { label: 'Em revisão',  cor: 'text-yellow-400', icon: RefreshCw },
  aposentado:  { label: 'Aposentado',  cor: 'text-red-400',    icon: Archive },
}

const difLabel = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' } as const
const difVariant = { 1: 'facil', 2: 'medio', 3: 'dificil' } as const

export default function AdminQuestoesPage() {
  const [questoes, setQuestoes] = useState<QuestaoAdmin[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFiltro, setStatusFiltro] = useState('')
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [atualizando, setAtualizando] = useState(false)

  const fetch_ = useCallback(async (p: number, s: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (s) params.set('status', s)
    const res = await fetch(`/api/admin/questoes?${params}`)
    const data = await res.json()
    setQuestoes(data.questoes)
    setTotal(data.total)
    setLoading(false)
  }, [])

  useEffect(() => { fetch_(page, statusFiltro) }, [fetch_, page, statusFiltro])

  function toggleSelecionada(id: string) {
    setSelecionadas((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  async function aplicarStatus(novoStatus: string) {
    if (!selecionadas.size) return
    setAtualizando(true)
    await fetch('/api/admin/questoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selecionadas], status: novoStatus }),
    })
    setSelecionadas(new Set())
    await fetch_(page, statusFiltro)
    setAtualizando(false)
  }

  async function aprovarRevisao() {
    if (!selecionadas.size) return
    setAtualizando(true)
    await fetch('/api/admin/questoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selecionadas], revisado: true, status: 'ativo' }),
    })
    setSelecionadas(new Set())
    await fetch_(page, statusFiltro)
    setAtualizando(false)
  }

  const STATUS_TABS = ['', 'rascunho', 'em_revisao', 'ativo', 'aposentado']

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Questões ({total})</h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s || 'todas'}
            onClick={() => { setStatusFiltro(s); setPage(1); setSelecionadas(new Set()) }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm border transition-colors',
              statusFiltro === s
                ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                : 'border-slate-700 text-slate-400 hover:border-slate-500',
            )}
          >
            {s ? statusConfig[s]?.label : 'Todas'}
          </button>
        ))}
      </div>

      {/* Ações em massa */}
      {selecionadas.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-800 border border-slate-700">
          <span className="text-sm text-slate-300">{selecionadas.size} selecionadas</span>
          <Button size="default" loading={atualizando} onClick={aprovarRevisao} className="text-xs h-8">
            ✓ Aprovar e publicar
          </Button>
          <Button variant="outline" size="default" loading={atualizando} onClick={() => aplicarStatus('aposentado')} className="text-xs h-8">
            Aposentar
          </Button>
          <Button variant="ghost" size="default" onClick={() => setSelecionadas(new Set())} className="text-xs h-8 ml-auto">
            Cancelar
          </Button>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {questoes.map((q) => {
            const cfg = statusConfig[q.status] ?? statusConfig.rascunho
            const Icon = cfg.icon
            const sel = selecionadas.has(q.id)

            return (
              <div
                key={q.id}
                className={cn(
                  'rounded-xl border p-4 cursor-pointer transition-colors',
                  sel ? 'border-brand-500/50 bg-brand-500/5' : 'border-slate-800 bg-slate-900 hover:border-slate-700',
                )}
                onClick={() => toggleSelecionada(q.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'shrink-0 w-5 h-5 rounded border mt-0.5 flex items-center justify-center',
                    sel ? 'bg-brand-500 border-brand-500' : 'border-slate-600',
                  )}>
                    {sel && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 line-clamp-1 mb-1.5">{q.enunciado}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="text-xs">{TEMA_LABELS[q.tema as Tema] ?? q.tema}</Badge>
                      <Badge variant={difVariant[q.dificuldade as 1 | 2 | 3] ?? 'medio'} className="text-xs">
                        {difLabel[q.dificuldade as 1 | 2 | 3] ?? 'Médio'}
                      </Badge>
                      <span className={cn('text-xs flex items-center gap-1', cfg.cor)}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                      {!q.revisado && (
                        <span className="text-xs text-amber-400">Não revisado</span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto">{q._count.respostas} resp.</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {total > 20 && (
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" size="default" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="flex items-center text-sm text-slate-400">
            Página {page} de {Math.ceil(total / 20)}
          </span>
          <Button variant="outline" size="default" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
