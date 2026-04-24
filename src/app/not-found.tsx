import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-brand-500">404</p>
        <h1 className="text-xl font-semibold text-slate-100">Página não encontrada</h1>
        <p className="text-slate-400 text-sm">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
