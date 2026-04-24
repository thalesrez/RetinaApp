import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — RetinaApp',
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8 text-slate-300">
        <div>
          <Link href="/" className="text-brand-400 text-sm hover:underline">← Voltar</Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-4">Política de Privacidade</h1>
          <p className="text-sm text-slate-500 mt-1">Última atualização: abril de 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">1. Dados coletados</h2>
          <p className="text-sm leading-relaxed">
            Coletamos nome, e-mail, CRM (opcional), estado (opcional), dados de desempenho nas
            questões e informações de pagamento processadas pela Pagar.me. Não armazenamos dados
            de cartão de crédito — eles são tratados exclusivamente pela Pagar.me.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">2. Finalidade do tratamento</h2>
          <p className="text-sm leading-relaxed">
            Os dados são utilizados exclusivamente para: (a) prestação do serviço educacional,
            (b) geração de relatórios de desempenho personalizados, (c) processamento de
            pagamentos, (d) comunicações relacionadas ao serviço.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">3. Base legal (LGPD)</h2>
          <p className="text-sm leading-relaxed">
            O tratamento se baseia no consentimento explícito dado no momento do cadastro
            (Art. 7º, I da LGPD) e na execução de contrato (Art. 7º, V da LGPD).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">4. Seus direitos</h2>
          <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside">
            <li>Acesso aos dados pessoais</li>
            <li>Portabilidade (exportar seus dados em JSON via perfil)</li>
            <li>Correção de dados incorretos</li>
            <li>Exclusão da conta e dados (soft delete + exclusão após 30 dias)</li>
            <li>Revogação do consentimento</li>
          </ul>
          <p className="text-sm">
            Para exercer esses direitos, acesse{' '}
            <Link href="/perfil" className="text-brand-400 hover:underline">Meu Perfil</Link>
            {' '}ou envie e-mail para privacidade@retinaapp.com.br.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">5. Retenção de dados</h2>
          <p className="text-sm leading-relaxed">
            Dados de contas excluídas são mantidos por 30 dias (logs financeiros por 5 anos
            conforme obrigação legal) e então removidos permanentemente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">6. Contato</h2>
          <p className="text-sm">
            Encarregado de proteção de dados (DPO): privacidade@retinaapp.com.br
          </p>
        </section>

        <p className="text-xs text-slate-600 pt-4 border-t border-slate-800">
          Este conteúdo é exclusivamente educacional. Não substitui avaliação clínica médica presencial.
        </p>
      </div>
    </div>
  )
}
