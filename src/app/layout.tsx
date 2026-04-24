import type { Metadata, Viewport } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Providers } from '@/components/shared/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'RetinaApp — Preparatório SBRV',
  description: 'A plataforma de preparação mais rigorosa para a prova de título de especialista em retina e vítreo.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RetinaApp',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0ea5e9',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
