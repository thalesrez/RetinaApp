export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>

      <footer className="fixed bottom-4 left-0 right-0 text-xs text-slate-600 text-center px-4">
        Este conteúdo é exclusivamente educacional. Não substitui avaliação clínica médica.
      </footer>
    </div>
  )
}
