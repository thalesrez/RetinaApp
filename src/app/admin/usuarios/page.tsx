'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface UsuarioAdmin {
  id: string
  name: string
  email: string
  crm: string | null
  plano: string
  plano_status: string
  plano_expira: string | null
  role: string
  created_at: string
  _count: { respostas: number }
}

const planoVariant: Record<string, 'free' | 'pro' | 'alumni' | 'default'> = {
  free: 'free', pro_mensal: 'pro', pro_anual: 'pro', alumni: 'alumni',
}

const statusCor: Record<string, string> = {
  active: 'text-green-400',
  past_due: 'text-yellow-400',
  canceled: 'text-red-400',
  trialing: 'text-blue-400',
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [buscaInput, setBuscaInput] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [editForm, setEditForm] = useState({ plano: '', plano_status: '' })

  const fetchUsuarios = useCallback(async (p: number, b: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (b) params.set('busca', b)
    const res = await fetch(`/api/admin/usuarios?${params}`)
    const data = await res.json()
    setUsuarios(data.usuarios)
    setTotal(data.total)
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsuarios(page, busca) }, [fetchUsuarios, page, busca])

  function abrirEdicao(u: UsuarioAdmin) {
    setEditando(u.id)
    setEditForm({ plano: u.plano, plano_status: u.plano_status })
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    await fetch('/api/admin/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: editando, ...editForm }),
    })
    setSalvando(false)
    setEditando(null)
    await fetchUsuarios(page, busca)
  }

  function buscar() {
    setBusca(buscaInput)
    setPage(1)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Usuários ({total})</h1>
      </div>

      {/* Busca */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por nome ou e-mail…"
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={buscar}>Buscar</Button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              {editando === u.id ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-200">{u.name} — {u.email}</p>
                  <div className="flex gap-3 flex-wrap">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Plano</p>
                      <select
                        value={editForm.plano}
                        onChange={(e) => setEditForm((f) => ({ ...f, plano: e.target.value }))}
                        className="rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {['free', 'pro_mensal', 'pro_anual', 'alumni'].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <select
                        value={editForm.plano_status}
                        onChange={(e) => setEditForm((f) => ({ ...f, plano_status: e.target.value }))}
                        className="rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {['active', 'past_due', 'canceled', 'trialing'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="default" loading={salvando} onClick={salvarEdicao} className="h-8 text-xs">
                      Salvar
                    </Button>
                    <Button variant="ghost" size="default" onClick={() => setEditando(null)} className="h-8 text-xs">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-medium text-slate-200 truncate">{u.name}</p>
                      {u.role === 'admin' && (
                        <span className="text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">admin</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{u.email}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={planoVariant[u.plano] ?? 'default'} className="text-xs">{u.plano}</Badge>
                      <span className={cn('text-xs', statusCor[u.plano_status] ?? 'text-slate-400')}>
                        {u.plano_status}
                      </span>
                      <span className="text-xs text-slate-500">{u._count.respostas} resp.</span>
                      {u.plano_expira && (
                        <span className="text-xs text-slate-500">
                          exp. {new Date(u.plano_expira).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="default"
                    className="shrink-0 text-xs h-8"
                    onClick={() => abrirEdicao(u)}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {total > 20 && (
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" size="default" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="flex items-center text-sm text-slate-400">
            Página {page} de {Math.ceil(total / 20)}
          </span>
          <Button variant="outline" size="default" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
