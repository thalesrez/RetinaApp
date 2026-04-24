'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})
type Form = z.infer<typeof schema>

export default function RecuperarSenhaPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    // Sempre mostra sucesso — evita user enumeration
    setSent(true)
  }

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight pt-2">
          Recuperar senha
        </h1>
        <p className="text-slate-400 text-sm">
          Informe seu e-mail e enviaremos instruções para redefinir sua senha.
        </p>
      </div>

      {sent ? (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-5 py-6 flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-300">E-mail enviado</p>
            <p className="text-sm text-slate-400">
              Se este e-mail estiver cadastrado, você receberá as instruções em breve.
              Verifique também sua caixa de spam.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail cadastrado</Label>
            <Input
              id="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              autoFocus
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Enviar instruções
          </Button>
        </form>
      )}
    </div>
  )
}
