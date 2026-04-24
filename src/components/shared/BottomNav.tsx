'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Activity, BarChart2, Brain, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Session } from 'next-auth'

const navItems = [
  { href: '/banco',     label: 'Questões',  icon: BookOpen },
  { href: '/simulado',  label: 'Simulado',  icon: Activity },
  { href: '/progresso', label: 'Progresso', icon: BarChart2 },
  { href: '/tutor',     label: 'Tutor',     icon: Brain },
  { href: '/perfil',    label: 'Perfil',    icon: User },
]

interface BottomNavProps {
  className?: string
  session: Session
}

export default function BottomNav({ className, session }: BottomNavProps) {
  const pathname = usePathname()
  const isPro = session.user.plano !== 'free'

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40',
      'safe-area-pb',
      className
    )}>
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          const isTutor = href === '/tutor'
          const targetHref = isTutor && !isPro ? '/planos?reason=tutor' : href

          return (
            <Link
              key={href}
              href={targetHref}
              className={cn(
                // 48px touch target mínimo
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-h-[48px] min-w-[48px] transition-colors',
                isActive ? 'text-brand-400' : 'text-slate-500'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
              {isTutor && !isPro && (
                <span className="text-[8px] text-amber-400 leading-none">Pro</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
