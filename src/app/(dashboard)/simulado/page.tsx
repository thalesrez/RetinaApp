'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, BookOpen, Trophy, ChevronRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TEMAS, TEMA_LABELS } from '@/config/constants'
import type { Tema } from '@/config/constants'
import type { TipoSimulado } from '@/types'

interface OpcaoSimulado {
  tipo: TipoSimulado
  titulo: string
  descricao: string
  questoes: string
  icon: React.ElementType
  proOnly: boolean
}

const OPCOES: OpcaoSimulado[] = [
  {
    tipo: 'pontos_fracos',
    titulo: 'Pontos Fracos',
    descricao: 'Foco nos temas com menor taxa de acerto. Algoritmo inteligente prioriza onde você mais precisa evoluir.',
    questoes: '20 questões',
    icon: Target,
    proOnly: false,
  },
  {
    tipo: 'por_tema',
    titulo: 'Por Tema',
    descricao: 'Selecione um ou mais temas e estude com foco. Ideal para revisar antes de um simulado maior.',
    questoes: 'Até 20 questões',
    icon: BookOpen,
    proOnly: false,
  },
  {
    tipo: 'prova_completa',
    titulo: 'Prova Completa',
    descricao: 'Simula as condições reais da prova de título. 60 questões distribuídas pelos pesos da prova SBRV.',
    questoes: '60 questões · 3 horas',
    icon: Trophy,
    proOnly: true,
  },
]

export default function SimuladoPage() {
  const router = useRouter()
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoSimulado | null>(null)
  const [temasSelecionados, setTemasSelecionados] = useState<Tema[]>([])
  const [modoProva, setModoProva] = useState(false)
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function toggleTema(t: Tema) {
    setTemasSelecionados((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  async function iniciarSimulado() {
    if (!tipoSelecionado) return
    if (tipoSelecionado === 'por_tema' && temasSelecionados.length === 0) {
      setErro('Selecione ao menos um tema.')
      return
    }
    setCriando(true)
    setErro(null)
    try {
      const res = await fetch('/api/simulados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoSelecionado,
          temas: tipoSelecionado === 'por_tema' ? temasSelecionados : undefined,
          modoProva: tipoSelecionado === 'prova_completa' ? true : modoProva,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao criar simulado.')
        return
      }
      router.push(`/simulado/${data.simuladoId}`)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setCriando(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <h1 className="text-xl font-semibold text-slate-100 mb-6">Simulados</h1>

      {/* Opções de tipo */}
      <div className="space-y-3 mb-6">
        {OPCOES.map((opcao) => {
          const Icon = opcao.icon
          const selecionado = tipoSelecionado === opcao.tipo
          return (
            <button
              key={opcao.tipo}
              onClick={() => { setTipoSelecionado(opcao.tipo); setErro(null) }}
              className={cn(
                'w-full rounded-xl border p-4 text-left transition-all',
                selecionado
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-600',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                  selecionado ? 'bg-brand-500/20' : 'bg-slate-800',
                )}>
                  <Icon className={cn('h-5 w-5', selecionado ? 'text-brand-400' : 'text-slate-400')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-100">{opcao.titulo}</p>
                    {opcao.proOnly && (
                      <span className="inline-flex items-center gap-1 text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30">
                        <Lock className="h-3 w-3" />Pro
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{opcao.descricao}</p>
                  <p className="text-xs text-slate-500 mt-1">{opcao.questoes}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Seleção de temas (só para por_tema) */}
      {tipoSelecionado === 'por_tema' && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 mb-6">
          <p className="text-sm font-semibold text-slate-200 mb-3">Selecionar temas</p>
          <div className="flex flex-wrap gap-2">
            {TEMAS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTema(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                  temasSelecionados.includes(t)
                    ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500',
                )}
              >
                {TEMA_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modo prova (sem feedback) para pontos_fracos e por_tema */}
      {tipoSelecionado && tipoSelecionado !== 'prova_completa' && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">Modo Prova</p>
            <p className="text-xs text-slate-400 mt-0.5">Sem feedback durante o simulado</p>
          </div>
          <button
            onClick={() => setModoProva((v) => !v)}
            className={cn(
              'w-11 h-6 rounded-full transition-colors relative',
              modoProva ? 'bg-brand-500' : 'bg-slate-700',
            )}
            role="switch"
            aria-checked={modoProva}
          >
            <span className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
              modoProva ? 'translate-x-6' : 'translate-x-1',
            )} />
          </button>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <p className="text-sm text-red-400 mb-4">{erro}</p>
      )}

      {/* Botão iniciar */}
      <Button
        size="lg"
        className="w-full h-14 text-base font-semibold gap-2"
        disabled={!tipoSelecionado}
        loading={criando}
        onClick={iniciarSimulado}
      >
        Iniciar Simulado
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
