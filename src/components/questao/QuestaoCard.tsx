'use client'

import Link from 'next/link'
import { Image as ImageIcon, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TEMA_LABELS } from '@/config/constants'
import type { QuestionPublica } from '@/types'

type StatusUsuario = 'nao_respondida' | 'acertada' | 'errada'

interface QuestaoCardProps {
  questao: QuestionPublica & { status_usuario: StatusUsuario }
}

const difLabel = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' } as const
const difVariant = { 1: 'facil', 2: 'medio', 3: 'dificil' } as const

const statusConfig: Record<StatusUsuario, {
  border: string
  bar: string
  icon: React.ElementType
  iconClass: string
}> = {
  nao_respondida: {
    border: 'border-slate-800',
    bar: 'bg-slate-700',
    icon: Circle,
    iconClass: 'text-slate-500',
  },
  acertada: {
    border: 'border-green-500/30',
    bar: 'bg-green-500',
    icon: CheckCircle2,
    iconClass: 'text-green-400',
  },
  errada: {
    border: 'border-red-500/30',
    bar: 'bg-red-500',
    icon: XCircle,
    iconClass: 'text-red-400',
  },
}

export function QuestaoCard({ questao }: QuestaoCardProps) {
  const { border, bar, icon: StatusIcon, iconClass } = statusConfig[questao.status_usuario]

  return (
    <Link
      href={`/banco/${questao.id}`}
      className={cn(
        'block rounded-xl border bg-slate-900 p-4 transition-all',
        'hover:border-slate-600 hover:bg-slate-800 active:scale-[0.99]',
        border,
      )}
    >
      {/* Enunciado (2 linhas) */}
      <p className="text-sm text-slate-200 leading-relaxed line-clamp-2 mb-3">
        {questao.enunciado}
      </p>

      {/* Footer: badges + ícones */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="default" className="text-xs shrink-0">
          {TEMA_LABELS[questao.tema] ?? questao.tema}
        </Badge>
        <Badge
          variant={difVariant[questao.dificuldade] ?? 'medio'}
          className="text-xs shrink-0"
        >
          {difLabel[questao.dificuldade] ?? 'Médio'}
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          {questao.imagem_url && (
            <ImageIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-label="Tem imagem" />
          )}
          <StatusIcon className={cn('h-4 w-4 shrink-0', iconClass)} />
        </div>
      </div>

      {/* Mini progress bar (status visual) */}
      <div className="mt-3 h-0.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div className={cn('h-full rounded-full', bar, questao.status_usuario === 'nao_respondida' ? 'w-0' : 'w-full')} />
      </div>
    </Link>
  )
}
