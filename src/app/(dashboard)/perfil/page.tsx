'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { User, Bell, Shield, Download, Trash2, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PerfilData {
  id: string
  name: string
  email: string
  crm: string | null
  estado: string | null
  plano: string
  plano_status: string
  plano_expira: string | null
  created_at: string
  notif_preferences: {
    lembrete_estudo: boolean
    horario_lembrete: string
    notif_push_enabled: boolean
  } | null
}

const planoLabels: Record<string, string> = {
  free: 'Acesso Livre',
  pro_mensal: 'Pro Mensal',
  pro_anual: 'Pro Anual',
  alumni: 'Alumni',
}

const planoVariants: Record<string, 'free' | 'pro' | 'alumni'> = {
  free: 'free',
  pro_mensal: 'pro',
  pro_anual: 'pro',
  alumni: 'alumni',
}

export default function PerfilPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const [form, setForm] = useState({ name: '', crm: '', estado: '' })
  const [notifForm, setNotifForm] = useState({
    lembrete_estudo: true, horario_lembrete: '20:00',
  })

  useEffect(() => {
    fetch('/api/usuarios/me/perfil')
      .then((r) => r.json())
      .then((d: PerfilData) => {
        setPerfil(d)
        setForm({ name: d.name, crm: d.crm ?? '', estado: d.estado ?? '' })
        setNotifForm({
          lembrete_estudo: d.notif_preferences?.lembrete_estudo ?? true,
          horario_lembrete: d.notif_preferences?.horario_lembrete ?? '20:00',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function salvarPerfil() {
    setSalvando(true)
    await fetch('/api/usuarios/me/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ...notifForm }),
    })
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  async function baixarDados() {
    const res = await fetch('/api/usuarios/me/data')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `retinaapp-meus-dados.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function excluirConta() {
    await fetch('/api/usuarios/me', { method: 'DELETE' })
    await signOut({ callbackUrl: '/login' })
  }

  if (loading) return <PerfilSkeleton />

  return (
    <div className="max-w-2xl mx-auto pb-8 space-y-6">
      <h1 className="text-xl font-semibold text-slate-100">Perfil</h1>

      {/* Plano atual */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">Plano atual</p>
          <div className="flex items-center gap-2">
            <Badge variant={planoVariants[perfil?.plano ?? 'free'] ?? 'free'}>
              {planoLabels[perfil?.plano ?? 'free']}
            </Badge>
            {perfil?.plano_status === 'past_due' && (
              <span className="text-xs text-red-400">Pagamento pendente</span>
            )}
          </div>
          {perfil?.plano_expira && (
            <p className="text-xs text-slate-500 mt-1">
              Expira em {new Date(perfil.plano_expira).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        {(perfil?.plano === 'free' || perfil?.plano_status !== 'active') && (
          <Link href="/planos">
            <Button size="default" className="gap-1 text-sm">
              Assinar Pro
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Dados pessoais */}
      <Section titulo="Dados Pessoais" icon={User}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={perfil?.email ?? ''} disabled className="mt-1 opacity-60" />
            <p className="text-xs text-slate-500 mt-1">O e-mail não pode ser alterado.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="crm">CRM</Label>
              <Input
                id="crm"
                placeholder="CRM-XX 123456"
                value={form.crm}
                onChange={(e) => setForm((f) => ({ ...f, crm: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input
                id="estado"
                placeholder="SP"
                maxLength={2}
                value={form.estado}
                onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value.toUpperCase() }))}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Notificações */}
      <Section titulo="Notificações" icon={Bell}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-200">Lembrete de estudo</p>
              <p className="text-xs text-slate-500">Receba um lembrete diário para estudar</p>
            </div>
            <button
              onClick={() => setNotifForm((n) => ({ ...n, lembrete_estudo: !n.lembrete_estudo }))}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                notifForm.lembrete_estudo ? 'bg-brand-500' : 'bg-slate-700',
              )}
              role="switch"
              aria-checked={notifForm.lembrete_estudo}
            >
              <span className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                notifForm.lembrete_estudo ? 'translate-x-6' : 'translate-x-1',
              )} />
            </button>
          </div>
          {notifForm.lembrete_estudo && (
            <div>
              <Label htmlFor="horario">Horário do lembrete</Label>
              <Input
                id="horario"
                type="time"
                value={notifForm.horario_lembrete}
                onChange={(e) => setNotifForm((n) => ({ ...n, horario_lembrete: e.target.value }))}
                className="mt-1 w-32"
              />
            </div>
          )}
        </div>
      </Section>

      {/* Botão salvar */}
      <Button
        size="lg"
        className="w-full h-12 gap-2"
        loading={salvando}
        onClick={salvarPerfil}
      >
        {salvo ? (
          <><Check className="h-4 w-4" /> Salvo!</>
        ) : 'Salvar alterações'}
      </Button>

      {/* LGPD */}
      <Section titulo="Privacidade e Dados" icon={Shield}>
        <div className="space-y-3">
          <button
            onClick={baixarDados}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
          >
            <Download className="h-4 w-4 text-brand-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-200">Baixar meus dados</p>
              <p className="text-xs text-slate-500">Exportar todas as suas respostas e simulados (JSON)</p>
            </div>
          </button>

          {!confirmandoExclusao ? (
            <button
              onClick={() => setConfirmandoExclusao(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left"
            >
              <Trash2 className="h-4 w-4 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300">Excluir minha conta</p>
                <p className="text-xs text-slate-500">Seus dados serão ocultados (LGPD Art. 18 VI)</p>
              </div>
            </button>
          ) : (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-3">
              <p className="text-sm text-red-300 font-semibold">Confirmar exclusão?</p>
              <p className="text-xs text-slate-400">Esta ação não pode ser desfeita. Você perderá acesso à plataforma.</p>
              <div className="flex gap-3">
                <Button variant="outline" size="default" className="flex-1" onClick={() => setConfirmandoExclusao(false)}>
                  Cancelar
                </Button>
                <Button
                  size="default"
                  className="flex-1 bg-red-600 hover:bg-red-700 border-none"
                  onClick={excluirConta}
                >
                  Excluir conta
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Seus dados são protegidos conforme a LGPD (Lei 13.709/2018).
            Para exercer seus direitos, acesse{' '}
            <Link href="/privacidade" className="text-brand-400 underline">Política de Privacidade</Link>.
          </p>
        </div>
      </Section>
    </div>
  )
}

function Section({
  titulo, icon: Icon, children,
}: {
  titulo: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-brand-400" />
        {titulo}
      </h2>
      {children}
    </div>
  )
}

function PerfilSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 pt-2">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}
