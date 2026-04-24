import { BookOpen } from 'lucide-react'

interface BadgeReferenciaProps {
  referencia: string | null
}

export function BadgeReferencia({ referencia }: BadgeReferenciaProps) {
  if (!referencia) return null

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1">
      <BookOpen className="h-3 w-3 text-brand-400 shrink-0" />
      <span className="text-xs text-brand-300 leading-tight">{referencia}</span>
    </div>
  )
}
