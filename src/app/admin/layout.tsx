import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { BookOpen, Users, BarChart2 } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') redirect('/banco')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Admin header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-3 flex items-center gap-4">
        <Link href="/banco" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
          ← Sair do Admin
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-sm font-semibold text-brand-300">Painel Admin</span>
        <nav className="flex items-center gap-3 ml-auto">
          <AdminLink href="/admin/questoes" icon={BookOpen} label="Questões" />
          <AdminLink href="/admin/usuarios" icon={Users} label="Usuários" />
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}

function AdminLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  )
}
