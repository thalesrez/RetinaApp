import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Página raiz — redireciona usuários autenticados para o banco
// e não-autenticados para o login
export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/banco')
  }
  redirect('/login')
}
