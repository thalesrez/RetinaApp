'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CheckCircle2, XCircle, Clock, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TEMA_LABELS, QUESTOES } from '@/config/constants'
import type { QuestionPublica } from '@/types'

type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E'
const ALTERNATIVAS: Alternativa[] = ['A', 'B', 'C', 'D', 'E']

interface SimuladoData {
  simulado: {
    id: string; tipo: string; status: string
    modo_prova: boolean; total: number; iniciado_em: string
  }
  questoes: QuestionPublica[]
  respostas: Record<string, { correta: boolean; resposta: string }>
}

interface ResultadoSimulado {
  acertos: number; total: number; taxa_acerto: number
  tempo_total_segundos: number
  por_tema: { tema: string; acertos: number; total: number; taxa_acerto: number }[]
}

function formatarTempo(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SimuladoExecucaoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [dados, setDados] = useState<SimuladoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [questaoIndex, setQuestaoIndex] = useState(0)
  const [selecionada, setSelecionada] = useState<Alternativa | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [respondidas, setRespondidas] = useState<Map<string, { correta: boolean; resposta: string; gabarito: string }>>(new Map())
  const [concluindo, setConcluindo] = useState(false)
  const [resultado, setResultado] = useState<ResultadoSimulado | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const inicioRef = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`/api/simulados/${id}`)
      .then((r) => r.json())
      .then((d: SimuladoData) => {
        setDados(d)
        // Restaura respostas já dadas (ao voltar para a página)
        const map = new Map<string, { correta: boolean; resposta: string; gabarito: string }>()
        for (const [qId, r] of Object.entries(d.respostas)) {
          map.set(qId, { correta: r.correta, resposta: r.resposta, gabarito: '' })
        }
        setRespondidas(map)
        // Vai para a primeira questão não respondida
        const primeiraLivre = d.questoes.findIndex((q) => !d.respostas[q.id])
        setQuestaoIndex(Math.max(0, primeiraLivre === -1 ? d.questoes.length - 1 : primeiraLivre))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTempoDecorrido((t) => t + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  if (loading) return <SimuladoSkeleton />
  if (!dados) return (
    <div className="text-center py-16">
      <p className="text-slate-400">Simulado não encontrado.</p>
    </div>
  )
  if (resultado) return <TelaResultado resultado={resultado} tipo={dados.simulado.tipo} router={router} />

  const questao = dados.questoes[questaoIndex]
  const totalQuestoes = dados.questoes.length
  const totalRespondidas = respondidas.size
  const modoProva = dados.simulado.modo_prova
  const jaRespondida = respondidas.has(questao?.id ?? '')
  const respostaAtual = respondidas.get(questao?.id ?? '')

  const alternativaTexto: Record<Alternativa, string> = {
    A: questao?.alternativa_a ?? '', B: questao?.alternativa_b ?? '',
    C: questao?.alternativa_c ?? '', D: questao?.alternativa_d ?? '',
    E: questao?.alternativa_e ?? '',
  }

  async function confirmarResposta() {
    if (!selecionada || !questao || jaRespondida) return
    setConfirmando(true)
    const tempoMs = Date.now() - inicioRef.current
    inicioRef.current = Date.now()

    const res = await fetch(`/api/questoes/${questao.id}/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resposta: selecionada, tempoMs, simuladoId: id, modoProva }),
    })
    const data = await res.json()
    setRespondidas((prev) => new Map(prev).set(questao.id, {
      correta: data.correta,
      resposta: selecionada,
      gabarito: data.gabarito,
    }))
    setSelecionada(null)
    setConfirmando(false)
  }

  function proximaQuestao() {
    if (questaoIndex < totalQuestoes - 1) {
      setQuestaoIndex((i) => i + 1)
      setSelecionada(null)
    }
  }

  async function concluir() {
    if (totalRespondidas < totalQuestoes) return
    setConcluindo(true)
    const res = await fetch(`/api/simulados/${id}/concluir`, { method: 'POST' })
    const data = await res.json()
    if (timerRef.current) clearInterval(timerRef.current)
    setResultado(data)
  }

  const progresso = Math.round((totalRespondidas / totalQuestoes) * 100)

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 py-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">
            {totalRespondidas}/{totalQuestoes} respondidas
          </span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-mono">{formatarTempo(tempoDecorrido)}</span>
          </div>
        </div>
        {/* Barra de progresso */}
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
        {/* Navegação de questões */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {dados.questoes.map((q, i) => {
            const resp = respondidas.get(q.id)
            return (
              <button
                key={q.id}
                onClick={() => { setQuestaoIndex(i); setSelecionada(null) }}
                className={cn(
                  'shrink-0 w-7 h-7 rounded-md text-xs font-medium transition-colors',
                  i === questaoIndex && 'ring-2 ring-brand-500',
                  resp
                    ? resp.correta
                      ? 'bg-green-500/30 text-green-300'
                      : 'bg-red-500/30 text-red-300'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
                )}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Questão */}
      {questao && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="default" className="text-xs">{TEMA_LABELS[questao.tema] ?? questao.tema}</Badge>
            <span className="text-xs text-slate-500">Questão {questaoIndex + 1}</span>
          </div>

          <div className="mb-5">
            <p className="text-questao text-slate-100 leading-relaxed">{questao.enunciado}</p>
          </div>

          <div className="space-y-2 mb-4">
            {ALTERNATIVAS.map((letra) => {
              const isSelected = selecionada === letra
              const isGabarito = !modoProva && jaRespondida && respostaAtual?.gabarito === letra
              const isErrada = !modoProva && jaRespondida && respostaAtual?.resposta === letra && !respostaAtual?.correta

              return (
                <motion.button
                  key={letra}
                  onClick={() => !jaRespondida && setSelecionada(letra)}
                  disabled={jaRespondida}
                  whileTap={!jaRespondida ? { scale: 0.99 } : {}}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left min-h-[48px] transition-all',
                    !jaRespondida && !isSelected && 'border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800',
                    !jaRespondida && isSelected && 'border-brand-500 bg-brand-500/10',
                    !modoProva && jaRespondida && isGabarito && 'border-correta bg-green-500/10',
                    !modoProva && jaRespondida && isErrada && 'border-incorreta bg-red-500/10',
                    (!modoProva && jaRespondida && !isGabarito && !isErrada) && 'border-slate-800 bg-slate-900/50 opacity-60',
                    modoProva && jaRespondida && 'border-slate-800 bg-slate-900/50 opacity-60',
                  )}
                >
                  <span className={cn(
                    'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mt-0.5',
                    !jaRespondida && !isSelected && 'bg-slate-800 text-slate-400',
                    !jaRespondida && isSelected && 'bg-brand-500 text-white',
                    !modoProva && jaRespondida && isGabarito && 'bg-correta text-white',
                    !modoProva && jaRespondida && isErrada && 'bg-incorreta text-white',
                    (!modoProva && jaRespondida && !isGabarito && !isErrada) && 'bg-slate-800 text-slate-500',
                    modoProva && jaRespondida && 'bg-slate-800 text-slate-500',
                  )}>{letra}</span>
                  <span className="text-alternativa text-slate-200 leading-relaxed pt-0.5 flex-1">
                    {alternativaTexto[letra]}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Feedback (apenas fora do modo prova) */}
          {!modoProva && jaRespondida && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-semibold mb-4',
                  respostaAtual?.correta
                    ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                    : 'bg-red-500/10 border border-red-500/20 text-red-300',
                )}
              >
                {respostaAtual?.correta
                  ? `✓ Correto! Gabarito: ${respostaAtual.gabarito}`
                  : `✗ Incorreto. Gabarito: ${respostaAtual?.gabarito}`}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}

      {/* Botões fixos */}
      <div className="fixed bottom-20 md:bottom-6 left-0 right-0 md:left-auto md:right-auto md:relative px-4 md:px-0">
        <div className="max-w-2xl mx-auto space-y-2">
          {!jaRespondida ? (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold"
              disabled={!selecionada}
              loading={confirmando}
              onClick={confirmarResposta}
            >
              Confirmar resposta
            </Button>
          ) : (
            <div className="flex gap-3">
              {questaoIndex < totalQuestoes - 1 && (
                <Button
                  size="default"
                  className="flex-1 gap-2"
                  onClick={proximaQuestao}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {totalRespondidas === totalQuestoes && (
                <Button
                  size="default"
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  loading={concluindo}
                  onClick={concluir}
                >
                  <Flag className="h-4 w-4" />
                  Concluir Simulado
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TelaResultado({
  resultado,
  tipo,
  router,
}: {
  resultado: ResultadoSimulado
  tipo: string
  router: ReturnType<typeof useRouter>
}) {
  const pct = Math.round(resultado.taxa_acerto * 100)
  const cor = pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="max-w-2xl mx-auto pb-8 space-y-6">
      <div className="text-center pt-4">
        <div className={cn('text-6xl font-bold mb-2', cor)}>{pct}%</div>
        <p className="text-slate-400">
          {resultado.acertos} de {resultado.total} questões corretas
        </p>
        <p className="text-slate-500 text-sm mt-1">
          Tempo: {formatarTempo(resultado.tempo_total_segundos)}
        </p>
      </div>

      {/* Por tema */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Resultado por Tema</h2>
        <div className="space-y-3">
          {resultado.por_tema.map((t) => {
            const taxaPct = Math.round(t.taxa_acerto * 100)
            const corTema = taxaPct >= 70 ? '#22c55e' : taxaPct >= 40 ? '#f59e0b' : '#ef4444'
            return (
              <div key={t.tema}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-300">
                    {TEMA_LABELS[t.tema as keyof typeof TEMA_LABELS] ?? t.tema}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: corTema }}>
                    {t.acertos}/{t.total} ({taxaPct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${taxaPct}%`, backgroundColor: corTema }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => router.push('/simulado')}>
          Novo Simulado
        </Button>
        <Button className="flex-1" onClick={() => router.push('/progresso')}>
          Ver Progresso
        </Button>
      </div>
    </div>
  )
}

function SimuladoSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 pt-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
    </div>
  )
}
