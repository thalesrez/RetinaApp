import type { Metadata, Viewport } from 'next'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
        <footer className="hidden">
          {/* Rodapé de compliance médico — visível nos layouts internos */}
          Este conteúdo é exclusivamente educacional e destina-se à preparação
          para a prova de título de especialista. Não substitui avaliação clínica médica presencial.
        </footer>
      </body>
    </html>
  )
}
