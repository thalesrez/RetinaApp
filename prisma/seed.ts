import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { AUTH, TEMAS, TEMA_PESO_PROVA } from '../src/config/constants'

const prisma = new PrismaClient()

const SENHA_TESTE = 'TesteSBRV2025!'

async function main() {
  console.log('Iniciando seed...')

  // Hash da senha de teste
  const passwordHash = await bcrypt.hash(SENHA_TESTE, AUTH.BCRYPT_ROUNDS)

  // Usuários de teste
  const usuarios = await Promise.all([
    prisma.user.upsert({
      where: { email: 'free@retinaapp.test' },
      update: {},
      create: {
        email: 'free@retinaapp.test',
        name: 'Usuário Free Teste',
        password_hash: passwordHash,
        plano: 'free',
        plano_status: 'active',
        lgpd_consent_at: new Date(),
        lgpd_consent_ip: '127.0.0.1',
      },
    }),
    prisma.user.upsert({
      where: { email: 'pro@retinaapp.test' },
      update: {},
      create: {
        email: 'pro@retinaapp.test',
        name: 'Usuário Pro Teste',
        password_hash: passwordHash,
        plano: 'pro_mensal',
        plano_status: 'active',
        lgpd_consent_at: new Date(),
        lgpd_consent_ip: '127.0.0.1',
      },
    }),
    prisma.user.upsert({
      where: { email: 'anual@retinaapp.test' },
      update: {},
      create: {
        email: 'anual@retinaapp.test',
        name: 'Usuário Pro Anual Teste',
        password_hash: passwordHash,
        plano: 'pro_anual',
        plano_status: 'active',
        lgpd_consent_at: new Date(),
        lgpd_consent_ip: '127.0.0.1',
      },
    }),
    prisma.user.upsert({
      where: { email: 'alumni@retinaapp.test' },
      update: {},
      create: {
        email: 'alumni@retinaapp.test',
        name: 'Usuário Alumni Teste',
        password_hash: passwordHash,
        plano: 'alumni',
        plano_status: 'active',
        lgpd_consent_at: new Date(),
        lgpd_consent_ip: '127.0.0.1',
      },
    }),
    prisma.user.upsert({
      where: { email: 'inadimplente@retinaapp.test' },
      update: {},
      create: {
        email: 'inadimplente@retinaapp.test',
        name: 'Usuário Inadimplente Teste',
        password_hash: passwordHash,
        plano: 'pro_mensal',
        plano_status: 'past_due',
        lgpd_consent_at: new Date(),
        lgpd_consent_ip: '127.0.0.1',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@retinaapp.test' },
      update: {},
      create: {
        email: 'admin@retinaapp.test',
        name: 'Thales Rezende (Admin)',
        password_hash: passwordHash,
        plano: 'pro_anual',
        plano_status: 'active',
        role: 'admin',
        lgpd_consent_at: new Date(),
        lgpd_consent_ip: '127.0.0.1',
      },
    }),
  ])

  console.log(`${usuarios.length} usuários criados`)

  // 50 questões de exemplo distribuídas por tema
  const questoesExemplo = gerarQuestoesExemplo()
  for (const q of questoesExemplo) {
    await prisma.question.create({ data: q })
  }

  console.log(`${questoesExemplo.length} questões de exemplo criadas`)
  console.log('Seed concluído.')
}

function gerarQuestoesExemplo() {
  const questoes = []
  const temasList = [...TEMAS]

  // Distribuir 50 questões proporcionalmente aos pesos da prova
  for (let i = 0; i < 50; i++) {
    const tema = temasList[i % temasList.length]
    questoes.push({
      enunciado: `[RASCUNHO] Sobre ${tema}, assinale a alternativa INCORRETA:`,
      alternativa_a: 'Alternativa A — aguardando revisão clínica do fundador',
      alternativa_b: 'Alternativa B — aguardando revisão clínica do fundador',
      alternativa_c: 'Alternativa C — aguardando revisão clínica do fundador',
      alternativa_d: 'Alternativa D — aguardando revisão clínica do fundador',
      alternativa_e: 'Alternativa E — aguardando revisão clínica do fundador',
      gabarito: 'A',
      tema,
      subtema: 'A definir',
      dificuldade: 2,
      fonte: 'original' as const,
      revisado: false, // RAZÃO: Todas as questões de seed precisam de revisão clínica do fundador
      status: 'rascunho',
      fallback_comment: `O gabarito correto é a alternativa A. Esta questão aborda conceitos de ${tema}.`,
      imagem_url: i < 10 ? 'https://via.placeholder.com/800x600?text=OCT+Placeholder' : null,
      imagem_tipo: i < 10 ? ('oct' as const) : null,
    })
  }

  return questoes
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
