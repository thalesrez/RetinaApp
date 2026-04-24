import Link from 'next/link'
import { Zap } from 'lucide-react'
import { PLANOS } from '@/config/constants'

export function UpgradeBanner() {
  const preco = (PLANOS.PRO_MENSAL.preco_centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200 truncate">
            <span className="font-semibold">Plano Grátis</span> — 20 questões/mês.
            Acesse questões ilimitadas, Tutor IA e simulados personalizados.
          </p>
        </div>
        <Link
          href="/planos"
          className="shrink-0 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg px-3 py-1.5 hover:bg-amber-400 transition-colors whitespace-nowrap"
        >
          Assinar Pro — {preco}/mês
        </Link>
      </div>
    </div>
  )
}
