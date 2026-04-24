import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-500/20 text-brand-300 border border-brand-500/30',
        pro: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        free: 'bg-slate-700 text-slate-300',
        alumni: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        forte: 'bg-green-500/20 text-green-300',
        medio: 'bg-yellow-500/20 text-yellow-300',
        fraco: 'bg-red-500/20 text-red-300',
        facil: 'bg-green-500/20 text-green-300',
        dificil: 'bg-red-500/20 text-red-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
