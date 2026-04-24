import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — RetinaApp',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8 text-slate-300">
        <div>
          <Link href="/" className="text-brand-400 text-sm hover:underline">← Voltar</Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-4">Termos de Uso</h1>
          <p className="text-sm text-slate-500 mt-1">Última atualização: abril de 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">1. Aceite</h2>
          <p className="text-sm leading-relaxed">
            Ao criar uma conta no RetinaApp, você concorda com estes termos. Se não concordar,
            não utilize o serviço.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">2. Natureza do serviço</h2>
          <p className="text-sm leading-relaxed">
            O RetinaApp é uma plataforma <strong>exclusivamente educacional</strong> destinada
            à preparação para a prova de título de especialista em retina e vítreo. O conteúdo
            não constitui diagnóstico médico, prescrição de tratamentos ou conduta clínica.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">3. Propriedade intelectual</h2>
          <p className="text-sm leading-relaxed">
            Todo o conteúdo da plataforma (questões, comentários, textos) é de propriedade do
            RetinaApp ou licenciado pela fonte original. É vedado reproduzir, distribuir ou
            comercializar qualquer conteúdo sem autorização expressa.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">4. Uso da conta</h2>
          <p className="text-sm leading-relaxed">
            Cada conta é pessoal e intransferível. É proibido compartilhar credenciais, usar
            sistemas automatizados (bots) para responder questões ou manipular o ranking.
            Violações resultarão em suspensão imediata.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">5. Pagamentos e cancelamento</h2>
          <p className="text-sm leading-relaxed">
            Assinaturas mensais podem ser canceladas a qualquer momento. O acesso continua
            ativo até o fim do período pago. Não há reembolso proporcional para períodos
            não utilizados, salvo em casos previstos no Código de Defesa do Consumidor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">6. Limitação de responsabilidade</h2>
          <p className="text-sm leading-relaxed">
            O RetinaApp não garante aprovação na prova de título. O desempenho na plataforma
            depende exclusivamente do esforço e dedicação do usuário.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">7. Contato</h2>
          <p className="text-sm">contato@retinaapp.com.br</p>
        </section>

        <p className="text-xs text-slate-600 pt-4 border-t border-slate-800">
          Este conteúdo é exclusivamente educacional. Não substitui avaliação clínica médica presencial.
        </p>
      </div>
    </div>
  )
}
