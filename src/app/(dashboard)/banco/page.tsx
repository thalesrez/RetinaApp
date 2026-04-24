'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, Image as ImageIcon, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { QuestaoCard } from '@/components/questao/QuestaoCard'
import { cn } from '@/lib/utils'
import { TEMAS, TEMA_LABELS, QUESTOES } from '@/config/constants'
import type { Tema } from '@/config/constants'
import type { QuestionPublica, PaginatedResult } from '@/types'

type StatusFiltro = 'nao_respondida' | 'acertada' | 'errada' | ''
type DificuldadeFiltro = 1 | 2 | 3 | 0

type QuestaoItem = QuestionPublica & { status_usuario: 'nao_respondida' | 'acertada' | 'errada' }

interface Filtros {
  tema: Tema | ''
  dificuldade: DificuldadeFiltro
  status: StatusFiltro
  comImagem: boolean
  busca: string
}

const STATUS_OPTIONS: { value: StatusFiltro; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'nao_respondida', label: 'Não feitas' },
  { value: 'acertada', label: 'Acertadas' },
  { value: 'errada', label: 'Erradas' },
]

const DIF_OPTIONS: { value: DificuldadeFiltro; label: string }[] = [
  { value: 0, label: 'Todas' },
  { value: 1, label: 'Fácil' },
  { value: 2, label: 'Médio' },
  { value: 3, label: 'Difícil' },
]

function buildUrl(filtros: Filtros, page: number): string {
  const p = new URLSearchParams()
  if (filtros.tema) p.set('tema', filtros.tema)
  if (filtros.dificuldade) p.set('dificuldade', String(filtros.dificuldade))
  if (filtros.status) p.set('status', filtros.status)
  if (filtros.comImagem) p.set('comImagem', 'true')
  if (filtros.busca.trim()) p.set('busca', filtros.busca.trim())
  p.set('page', String(page))
  return `/api/questoes?${p.toString()}`
}

export default function BancoPage() {
  const [filtros, setFiltros] = useState<Filtros>({
    tema: '', dificuldade: 0, status: '', comImagem: false, busca: '',
  })
  const [questoes, setQuestoes] = useState<QuestaoItem[]>([])
  const [meta, setMeta] = useState<Pick<PaginatedResult<unknown>, 'total' | 'page' | 'total_pages'>>({
    total: 0, page: 1, total_pages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeFiltrosRef = useRef(filtros)
  activeFiltrosRef.current = filtros

  const fetchPage = useCallback(async (f: Filtros, page: number, append: boolean) => {
    if (page === 1 && !append) setLoading(true)
    else setLoadingMore(true)

    try {
      const res = await fetch(buildUrl(f, page))
      if (!res.ok) return
      const data: PaginatedResult<QuestaoItem> = await res.json()
      setQuestoes((prev) => append ? [...prev, ...data.data] : data.data)
      setMeta({ total: data.total, page: data.page, total_pages: data.total_pages })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Reset and fetch when filters change (with debounce on busca)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      fetchPage(filtros, 1, false)
    }, filtros.busca ? 400 : 0)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.tema, filtros.dificuldade, filtros.status, filtros.comImagem, filtros.busca])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        const f = activeFiltrosRef.current
        setMeta((prev) => {
          if (prev.page < prev.total_pages) {
            fetchPage(f, prev.page + 1, true)
          }
          return prev
        })
      }
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchPage, loadingMore])

  function setFiltro<K extends keyof Filtros>(key: K, value: Filtros[K]) {
    setFiltros((prev) => ({ ...prev, [key]: value }))
  }

  const temFiltroAtivo = filtros.tema || filtros.dificuldade || filtros.status || filtros.comImagem

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Título + contador */}
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-100">Banco de Questões</h1>
        {!loading && (
          <span className="text-sm text-slate-400">
            {meta.total} {meta.total === 1 ? 'questão' : 'questões'}
          </span>
        )}
      </div>

      {/* Barra de busca + botão filtros */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar no enunciado…"
            className="pl-9"
            value={filtros.busca}
            onChange={(e) => setFiltro('busca', e.target.value)}
          />
        </div>
        <Button
          variant={temFiltroAtivo ? 'default' : 'outline'}
          size="default"
          className="shrink-0 gap-1.5"
          onClick={() => setFiltrosAbertos((v) => !v)}
          aria-expanded={filtrosAbertos}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {temFiltroAtivo && (
            <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs font-bold">
              {[filtros.tema, filtros.dificuldade, filtros.status, filtros.comImagem ? 'img' : ''].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Painel de filtros */}
      {filtrosAbertos && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 mb-4 space-y-4">
          {/* Status */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFiltro('status', o.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    filtros.status === o.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dificuldade */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Dificuldade</p>
            <div className="flex gap-2 flex-wrap">
              {DIF_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFiltro('dificuldade', o.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    filtros.dificuldade === o.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tema */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Tema</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltro('tema', '')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                  !filtros.tema
                    ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500',
                )}
              >
                Todos
              </button>
              {TEMAS.map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltro('tema', t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    filtros.tema === t
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500',
                  )}
                >
                  {TEMA_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Com imagem */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              Apenas questões com imagem
            </p>
            <button
              onClick={() => setFiltro('comImagem', !filtros.comImagem)}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                filtros.comImagem ? 'bg-brand-500' : 'bg-slate-700',
              )}
              role="switch"
              aria-checked={filtros.comImagem}
            >
              <span className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                filtros.comImagem ? 'translate-x-6' : 'translate-x-1',
              )} />
            </button>
          </div>

          {/* Limpar filtros */}
          {temFiltroAtivo && (
            <button
              onClick={() => setFiltros({ tema: '', dificuldade: 0, status: '', comImagem: false, busca: filtros.busca })}
              className="text-xs text-slate-500 hover:text-slate-300 underline-offset-2 underline transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(QUESTOES.PAGINA_SIZE / 2)].map((_, i) => (
            <Skeleton key={i} className="h-[108px] w-full rounded-xl" />
          ))}
        </div>
      ) : questoes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 mb-2">Nenhuma questão encontrada.</p>
          {temFiltroAtivo && (
            <button
              onClick={() => setFiltros({ tema: '', dificuldade: 0, status: '', comImagem: false, busca: '' })}
              className="text-brand-400 text-sm hover:text-brand-300 transition-colors"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questoes.map((q) => (
            <QuestaoCard key={q.id} questao={q} />
          ))}
        </div>
      )}

      {/* Sentinela de infinite scroll */}
      <div ref={sentinelRef} className="h-1" aria-hidden />

      {/* Loading more */}
      {loadingMore && (
        <div className="space-y-3 mt-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[108px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Fim da lista */}
      {!loading && !loadingMore && meta.page >= meta.total_pages && questoes.length > 0 && (
        <p className="text-center text-sm text-slate-600 mt-6">
          {questoes.length} de {meta.total} questões carregadas
        </p>
      )}
    </div>
  )
}
