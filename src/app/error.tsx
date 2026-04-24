'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Sentry captura automaticamente via @sentry/nextjs
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-5xl">⚠️</p>
        <h1 className="text-xl font-semibold text-slate-100">Algo deu errado</h1>
        <p className="text-slate-400 text-sm">
          Ocorreu um erro inesperado. Nossa equipe foi notificada.
        </p>
        <button
          onClick={reset}
          className="mt-4 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
