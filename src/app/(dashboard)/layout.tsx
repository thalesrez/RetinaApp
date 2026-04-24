import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/shared/Sidebar'
import BottomNav from '@/components/shared/BottomNav'
import { UpgradeBanner } from '@/components/shared/UpgradeBanner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar — visível apenas em md+ */}
      <Sidebar className="hidden md:flex" session={session} />

      {/* Conteúdo principal */}
      <main className="md:ml-64 min-h-screen flex flex-col">
        {/* Banner de upgrade para plano Free */}
        {session.user.plano === 'free' && <UpgradeBanner />}

        {/* Área de conteúdo com padding seguro para bottom nav no mobile */}
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom navigation — visível apenas em mobile */}
      <BottomNav className="md:hidden" session={session} />

      {/* Rodapé de compliance médico obrigatório */}
      <footer className="md:ml-64 text-xs text-slate-600 text-center py-3 px-4 border-t border-slate-800/50">
        Este conteúdo é exclusivamente educacional e destina-se à preparação para a prova de título de especialista.
        Não substitui avaliação clínica médica presencial.
      </footer>
    </div>
  )
}
