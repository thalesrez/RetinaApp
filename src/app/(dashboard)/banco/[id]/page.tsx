'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ComentarioStream } from '@/components/questao/ComentarioStream'
import { ImagemClinica } from '@/components/questao/ImagemClinica'
import { cn } from '@/lib/utils'
import { TEMA_LABELS, DIFICULDADE } from '@/config/constants'
import type { QuestionPublica } from '@/types'

type Estado = 'nao_respondida' | 'respondida'
type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E'
const ALTERNATIVAS: Alternativa[] = ['A', 'B', 'C', 'D', 'E']

interface RespostaResult {
  correta: boolean
  gabarito: Alternativa
  comentario: string | null
  referencia_texto: string | null
}

export default function QuestaoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [questao, setQuestao] = useState<QuestionPublica | null>(null)
  const [estado, setEstado] = useState<Estado>('nao_respondida')
  const [selecionada, setSelecionada] = useState<Alternativa | null>(null)
  const [resultado, setResultado] = useState<RespostaResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmando, setConfirmando] = useState(false)
  const inicioRef = useRef<number>(Date.now())

  useEffect(() => {
    inicioRef.current = Date.now()
    fetch(`/api/questoes/${id}`)
      .then((r) => r.json())
      .then((q) => { setQuestao(q); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [id])

  async function confirmarResposta() {
    if (!selecionada || !questao) return
    setConfirmando(true)
    const tempoMs = Date.now() - inicioRef.current

    const res = await fetch(`/api/questoes/${id}/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resposta: selecionada, tempoMs }),
    })
    const data = await res.json()
    setResultado(data)
    setEstado('respondida')
    setConfirmando(false)
  }

  const difLabel = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' } as const
  const difVariant = { 1: 'facil', 2: 'medio', 3: 'dificil' } as const

  if (loading) return <QuestaoSkeleton />

  if (!questao) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Questão não encontrada.</p>
        <Link href="/banco" className="text-brand-400 text-sm mt-2 block">← Voltar ao banco</Link>
      </div>
    )
  }

  const alternativaTexto: Record<Alternativa, string> = {
    A: questao.alternativa_a, B: questao.alternativa_b, C: questao.alternativa_c,
    D: questao.alternativa_d, E: questao.alternativa_e,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-0 pb-4">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-0 py-3 mb-4 flex items-center gap-3">
        <Link href="/banco" className="p-2 -ml-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm text-slate-400 flex-1">Banco de Questões</span>
        <Badge variant="default" className="text-xs">
          {TEMA_LABELS[questao.tema] ?? questao.tema}
        </Badge>
        <Badge variant={difVariant[questao.dificuldade] ?? 'medio'} className="text-xs">
          {difLabel[questao.dificuldade] ?? 'Médio'}
        </Badge>
      </div>

      {/* Imagem clínica (se existir) */}
      {questao.imagem_url && (
        <div className="mb-4">
          <ImagemClinica
            url={questao.imagem_url}
            legenda={questao.imagem_legenda}
            tipo={questao.imagem_tipo}
          />
        </div>
      )}

      {/* Enunciado */}
      <div className="mb-6">
        <p className="text-questao text-slate-100 leading-relaxed">
          {questao.enunciado}
        </p>
      </div>

      {/* Alternativas */}
      <div className="space-y-2 mb-6">
        {ALTERNATIVAS.map((letra) => {
          const texto = alternativaTexto[letra]
          const isSelected = selecionada === letra
          const isGabarito = estado === 'respondida' && resultado?.gabarito === letra
          const isErrada = estado === 'respondida' && isSelected && !resultado?.correta

          return (
            <motion.button
              key={letra}
              onClick={() => estado === 'nao_respondida' && setSelecionada(letra)}
              disabled={estado === 'respondida'}
              className={cn(
                // min-height 48px — touch target obrigatório
                'w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left min-h-[48px] transition-all',
                estado === 'nao_respondida' && !isSelected &&
                  'border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800',
                estado === 'nao_respondida' && isSelected &&
                  'border-brand-500 bg-brand-500/10',
                estado === 'respondida' && isGabarito &&
                  'border-correta bg-green-500/10',
                estado === 'respondida' && isErrada &&
                  'border-incorreta bg-red-500/10',
                estado === 'respondida' && !isGabarito && !isErrada &&
                  'border-slate-800 bg-slate-900/50 opacity-60',
              )}
              whileTap={estado === 'nao_respondida' ? { scale: 0.99 } : {}}
            >
              {/* Letra */}
              <span className={cn(
                'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mt-0.5',
                estado === 'nao_respondida' && !isSelected && 'bg-slate-800 text-slate-400',
                estado === 'nao_respondida' && isSelected && 'bg-brand-500 text-white',
                estado === 'respondida' && isGabarito && 'bg-correta text-white',
                estado === 'respondida' && isErrada && 'bg-incorreta text-white',
                estado === 'respondida' && !isGabarito && !isErrada && 'bg-slate-800 text-slate-500',
              )}>
                {letra}
              </span>
              {/* Texto da alternativa */}
              <span className="text-alternativa text-slate-200 leading-relaxed pt-0.5 flex-1">
                {texto}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Resultado após responder */}
      <AnimatePresence>
        {estado === 'respondida' && resultado && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Banner de acerto/erro */}
            <div className={cn(
              'rounded-xl px-4 py-3 font-semibold text-sm',
              resultado.correta
                ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            )}>
              {resultado.correta
                ? `✓ Correto! O gabarito é a alternativa ${resultado.gabarito}.`
                : `✗ Incorreto. O gabarito correto é a alternativa ${resultado.gabarito}.`}
            </div>

            {/* Comentário streaming */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
              <ComentarioStream
                questionId={id}
                referencia={resultado.referencia_texto}
                comentarioCached={resultado.comentario}
              />
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="default"
                className="flex-1 gap-2"
                onClick={() => router.push(`/tutor?questaoId=${id}`)}
              >
                <MessageCircle className="h-4 w-4" />
                Tutor IA
              </Button>
              <Button
                size="default"
                className="flex-1 gap-2"
                onClick={() => router.push('/banco')}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão confirmar (antes de responder) */}
      {estado === 'nao_respondida' && (
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 md:left-auto md:right-auto md:relative px-4 md:px-0">
          <div className="max-w-2xl mx-auto">
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold shadow-lg"
              disabled={!selecionada}
              loading={confirmando}
              onClick={confirmarResposta}
            >
              Confirmar resposta
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestaoSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 pt-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-24 w-full" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
    </div>
  )
}
