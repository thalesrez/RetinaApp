'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Check, Zap, Star, GraduationCap, QrCode, CreditCard, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PLANOS } from '@/config/constants'

interface PlanoCardProps {
  id: string
  nome: string
  preco: number
  precoMensalEquiv?: number
  descricao: string
  recursos: string[]
  destaque?: boolean
  planoAtual: string
  icon: React.ElementType
  onAssinar: (plano: string) => void
  carregando: boolean
}

function formatarPreco(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PlanoCard({
  id, nome, preco, precoMensalEquiv, descricao, recursos, destaque, planoAtual, icon: Icon,
  onAssinar, carregando,
}: PlanoCardProps) {
  const ehAtual = planoAtual === id
  const ehGratis = preco === 0

  return (
    <div className={cn(
      'relative rounded-2xl border p-6 flex flex-col gap-4',
      destaque
        ? 'border-brand-500 bg-brand-500/5'
        : 'border-slate-800 bg-slate-900',
    )}>
      {destaque && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            MAIS POPULAR
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          destaque ? 'bg-brand-500/20' : 'bg-slate-800',
        )}>
          <Icon className={cn('h-5 w-5', destaque ? 'text-brand-400' : 'text-slate-400')} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">{nome}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{descricao}</p>
        </div>
      </div>

      <div>
        {ehGratis ? (
          <p className="text-3xl font-bold text-slate-100">Grátis</p>
        ) : (
          <div>
            <p className="text-3xl font-bold text-slate-100">{formatarPreco(preco)}</p>
            {precoMensalEquiv && (
              <p className="text-xs text-slate-500 mt-0.5">
                ~{formatarPreco(precoMensalEquiv)}/mês
              </p>
            )}
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {recursos.map((r) => (
          <li key={r} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
            {r}
          </li>
        ))}
      </ul>

      {ehAtual ? (
        <div className="mt-auto pt-2">
          <div className="w-full py-3 text-center text-sm font-semibold text-brand-300 bg-brand-500/10 border border-brand-500/30 rounded-xl">
            Plano atual
          </div>
        </div>
      ) : !ehGratis ? (
        <Button
          className={cn('mt-auto', destaque && 'bg-brand-500 hover:bg-brand-600')}
          onClick={() => onAssinar(id)}
          loading={carregando}
          size="default"
        >
          Assinar {nome}
        </Button>
      ) : null}
    </div>
  )
}

interface ModalPixProps {
  pixQrCode: string
  pixCopyPaste: string
  expiraEm: string
  onFechar: () => void
}

function ModalPix({ pixQrCode, pixCopyPaste, expiraEm, onFechar }: ModalPixProps) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(pixCopyPaste)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            <QrCode className="h-4 w-4 text-brand-400" />
            Pagar com PIX
          </h3>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {pixQrCode && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pixQrCode} alt="QR Code PIX" className="w-full rounded-xl bg-white p-4" />
        )}

        <button
          onClick={copiar}
          className="w-full py-3 rounded-xl border border-slate-600 bg-slate-800 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
        >
          {copiado ? '✓ Copiado!' : 'Copiar código PIX'}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Expira em {new Date(expiraEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
          Após o pagamento, acesso liberado em até 5 minutos.
        </p>
      </div>
    </div>
  )
}

export default function PlanosPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const planoAtual = session?.user.plano ?? 'free'

  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null)
  const [metodo, setMetodo] = useState<'pix' | 'cartao' | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erroPagamento, setErroPagamento] = useState<string | null>(null)
  const [pixData, setPixData] = useState<{ pixQrCode: string; pixCopyPaste: string; expiraEm: string } | null>(null)

  function iniciarCheckout(plano: string) {
    setPlanoSelecionado(plano)
    setMetodo(null)
    setErroPagamento(null)
  }

  async function confirmarMetodo(m: 'pix' | 'cartao') {
    if (!planoSelecionado) return
    setMetodo(m)
    setCarregando(true)
    setErroPagamento(null)

    try {
      const res = await fetch('/api/pagamentos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoSelecionado, metodo: m }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErroPagamento(data.error ?? 'Erro ao iniciar pagamento.')
        return
      }

      if (m === 'pix') {
        setPixData({ pixQrCode: data.pixQrCode, pixCopyPaste: data.pixCopyPaste, expiraEm: data.expiraEm })
        setPlanoSelecionado(null)
      } else {
        router.push(data.checkoutUrl)
      }
    } catch {
      setErroPagamento('Erro de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const planos: PlanoCardProps[] = [
    {
      id: 'free',
      nome: 'Acesso Livre',
      preco: 0,
      descricao: 'Para conhecer a plataforma',
      recursos: [
        '20 questões por mês',
        'Banco de questões básico',
        'Comentários de IA (limitado)',
      ],
      icon: Star,
      planoAtual,
      onAssinar: iniciarCheckout,
      carregando: false,
    },
    {
      id: 'pro_mensal',
      nome: 'Pro Mensal',
      preco: PLANOS.PRO_MENSAL.preco_centavos,
      descricao: 'Para quem estuda todo mês',
      recursos: [
        'Questões ilimitadas',
        'Tutor IA personalizado',
        'Simulados completos',
        'Dashboard de desempenho',
        'Ranking nacional',
        '30 consultas IA/dia',
      ],
      destaque: true,
      icon: Zap,
      planoAtual,
      onAssinar: iniciarCheckout,
      carregando: carregando && planoSelecionado === 'pro_mensal',
    },
    {
      id: 'pro_anual',
      nome: 'Pro Anual',
      preco: PLANOS.PRO_ANUAL.preco_centavos,
      precoMensalEquiv: PLANOS.PRO_ANUAL.preco_mensal_equivalente_centavos,
      descricao: '~30% de desconto vs mensal',
      recursos: [
        'Tudo do Pro Mensal',
        'Economia de ~R$ 285/ano',
        'Prioridade no suporte',
      ],
      icon: Star,
      planoAtual,
      onAssinar: iniciarCheckout,
      carregando: carregando && planoSelecionado === 'pro_anual',
    },
    {
      id: 'alumni',
      nome: 'Alumni',
      preco: PLANOS.ALUMNI.preco_centavos,
      descricao: 'Para quem já passou na prova',
      recursos: [
        '30 questões por mês',
        'Acesso ao banco completo',
        'Conteúdo de atualização',
      ],
      icon: GraduationCap,
      planoAtual,
      onAssinar: iniciarCheckout,
      carregando: carregando && planoSelecionado === 'alumni',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">
            Escolha seu plano
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Plataforma de preparação para a prova de título da SBRV.
            Conteúdo baseado nas referências oficiais do edital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {planos.map((p) => (
            <PlanoCard key={p.id} {...p} />
          ))}
        </div>

        {/* Modal de escolha de método de pagamento */}
        {planoSelecionado && !pixData && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-100">Como deseja pagar?</h3>
                <button onClick={() => setPlanoSelecionado(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {erroPagamento && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{erroPagamento}</p>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => confirmarMetodo('pix')}
                  disabled={carregando}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 bg-slate-800 hover:border-brand-500/50 transition-colors disabled:opacity-50"
                >
                  <QrCode className="h-6 w-6 text-green-400 shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-100">PIX</p>
                    <p className="text-xs text-slate-400">Pagamento imediato · Renovação manual</p>
                  </div>
                </button>

                <button
                  onClick={() => confirmarMetodo('cartao')}
                  disabled={carregando}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-700 bg-slate-800 hover:border-brand-500/50 transition-colors disabled:opacity-50"
                >
                  <CreditCard className="h-6 w-6 text-brand-400 shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-100">Cartão de Crédito</p>
                    <p className="text-xs text-slate-400">Cobrança automática · Cancele quando quiser</p>
                  </div>
                </button>
              </div>

              {carregando && (
                <p className="text-xs text-slate-500 text-center animate-pulse">Processando…</p>
              )}
            </div>
          </div>
        )}

        {/* Modal PIX */}
        {pixData && (
          <ModalPix
            {...pixData}
            onFechar={() => setPixData(null)}
          />
        )}

        <p className="text-center text-xs text-slate-600 mt-4">
          Este conteúdo é exclusivamente educacional. Não substitui avaliação clínica médica presencial.
        </p>
      </div>
    </div>
  )
}
