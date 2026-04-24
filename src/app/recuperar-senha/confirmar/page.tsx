'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function ConfirmarResetInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (senha.length < 8) {
      setErro('Senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    if (!token) {
      setErro('Link inválido. Solicite um novo e-mail de recuperação.')
      return
    }

    setCarregando(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: senha }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao atualizar senha.')
        return
      }
      setSucesso(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-400">Link inválido ou expirado.</p>
        <a href="/recuperar-senha" className="text-brand-400 text-sm hover:underline">
          Solicitar novo e-mail
        </a>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="text-center space-y-2">
        <p className="text-green-400 font-semibold">Senha atualizada!</p>
        <p className="text-sm text-slate-400">Redirecionando para o login…</p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-300 mb-1.5">Nova senha</label>
        <div className="relative">
          <input
            type={mostrar ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={8}
            className={cn(
              'w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3',
              'text-base text-slate-100 placeholder:text-slate-500 pr-12',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            )}
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1.5">Confirmar nova senha</label>
        <input
          type={mostrar ? 'text' : 'password'}
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
          className={cn(
            'w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3',
            'text-base text-slate-100 placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          )}
          placeholder="Repita a nova senha"
        />
      </div>

      {erro && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{erro}</p>
      )}

      <Button type="submit" className="w-full" loading={carregando}>
        Salvar nova senha
      </Button>
    </form>
  )
}

export default function ConfirmarResetPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100">Criar nova senha</h1>
          <p className="text-sm text-slate-400 mt-1">Digite e confirme sua nova senha.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <Suspense fallback={<div className="text-center text-slate-500 py-4">Carregando…</div>}>
            <ConfirmarResetInner />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
