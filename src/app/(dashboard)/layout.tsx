import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Layout principal — sidebar em desktop, bottom nav em mobile */}
      {/* Componentes Sidebar e BottomNav serão criados no Sprint 1 */}
      <main className="min-h-screen flex flex-col">
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Rodapé de compliance médico obrigatório */}
      <footer className="text-xs text-slate-500 text-center py-4 px-4 border-t border-slate-800">
        Este conteúdo é exclusivamente educacional e destina-se à preparação
        para a prova de título de especialista. Não substitui avaliação clínica médica presencial.
      </footer>
    </div>
  )
}
