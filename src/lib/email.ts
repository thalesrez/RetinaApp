import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = `RetinaApp <${process.env.SMTP_FROM ?? 'noreply@retinaapp.com.br'}>`
const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://retinaapp.com.br'

export async function enviarEmailResetSenha(email: string, token: string): Promise<void> {
  const link = `${BASE_URL}/recuperar-senha/confirmar?token=${token}`

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Redefinir sua senha — RetinaApp',
    text: `Você solicitou a redefinição de senha.\n\nClique no link abaixo para criar uma nova senha (válido por 1 hora):\n\n${link}\n\nSe não foi você, ignore este e-mail.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0ea5e9;margin-bottom:8px">Redefinir senha</h2>
        <p style="color:#334155">Você solicitou a redefinição de senha da sua conta RetinaApp.</p>
        <a href="${link}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Criar nova senha
        </a>
        <p style="color:#64748b;font-size:13px">
          Este link expira em <strong>1 hora</strong>.<br>
          Se não foi você quem solicitou, pode ignorar este e-mail.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="color:#94a3b8;font-size:11px">
          RetinaApp — Preparatório para a prova de título de especialista em retina e vítreo.<br>
          Este conteúdo é exclusivamente educacional. Não substitui avaliação clínica.
        </p>
      </div>
    `,
  })
}

export async function enviarEmailBoasVindas(email: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Bem-vindo ao RetinaApp!',
    text: `Olá, ${name}!\n\nSua conta foi criada com sucesso. Acesse ${BASE_URL} para começar a estudar.\n\nBons estudos!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0ea5e9;margin-bottom:8px">Bem-vindo, ${name}!</h2>
        <p style="color:#334155">
          Sua conta no RetinaApp foi criada com sucesso.<br>
          Comece agora e prepare-se para a prova de título de especialista em retina e vítreo.
        </p>
        <a href="${BASE_URL}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Acessar plataforma
        </a>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="color:#94a3b8;font-size:11px">
          RetinaApp — Preparatório para a prova de título de especialista em retina e vítreo.<br>
          Este conteúdo é exclusivamente educacional. Não substitui avaliação clínica.
        </p>
      </div>
    `,
  })
}
