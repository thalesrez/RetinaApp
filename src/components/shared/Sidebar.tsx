'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, BarChart2, Brain, Trophy, User, Activity, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Session } from 'next-auth'

const navItems = [
  { href: '/banco',     label: 'Banco de Questões', icon: BookOpen },
  { href: '/simulado',  label: 'Simulados',         icon: Activity },
  { href: '/progresso', label: 'Meu Progresso',     icon: BarChart2 },
  { href: '/tutor',     label: 'Tutor IA',          icon: Brain,  proOnly: true },
  { href: '/ranking',   label: 'Ranking',           icon: Trophy },
  { href: '/perfil',    label: 'Perfil',            icon: User },
]

interface SidebarProps {
  className?: string
  session: Session
}

export default function Sidebar({ className, session }: SidebarProps) {
  const pathname = usePathname()
  const plano = session.user.plano

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen w-64 flex-col bg-slate-900 border-r border-slate-800 z-40',
      className
    )}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <Link href="/banco" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-slate-100 font-semibold text-lg tracking-tight">RetinaApp</span>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, proOnly }) => {
          const isActive = pathname.startsWith(href)
          const locked = proOnly && plano === 'free'

          return (
            <Link
              key={href}
              href={locked ? '/planos?reason=tutor' : href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'bg-brand-500/15 text-brand-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                locked && 'opacity-60'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {proOnly && (
                <Badge variant="pro" className="text-[10px] px-1.5 py-0">Pro</Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé do sidebar — plano + logout */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
            <p className="text-xs font-medium text-slate-300 truncate">{session.user.name}</p>
          </div>
          <PlanoBadge plano={plano} />
        </div>

        {plano === 'free' && (
          <Link
            href="/planos"
            className="block w-full text-center text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg py-2 hover:bg-amber-500/25 transition-colors"
          >
            Assinar Pro →
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </aside>
  )
}

function PlanoBadge({ plano }: { plano: string }) {
  const map: Record<string, { label: string; variant: 'pro' | 'free' | 'alumni' | 'default' }> = {
    free:       { label: 'Grátis',     variant: 'free' },
    pro_mensal: { label: 'Pro',        variant: 'pro' },
    pro_anual:  { label: 'Pro Anual',  variant: 'pro' },
    alumni:     { label: 'Alumni',     variant: 'alumni' },
  }
  const { label, variant } = map[plano] ?? map.free
  return <Badge variant={variant}>{label}</Badge>
}
