'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const cadastroSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número'),
  lgpdConsent: z.boolean().refine((v) => v === true, {
    message: 'Você deve aceitar a Política de Privacidade para continuar.',
  }),
})
type CadastroForm = z.infer<typeof cadastroSchema>

export default function CadastroPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CadastroForm>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { lgpdConsent: false },
  })

  async function onSubmit(data: CadastroForm) {
    setServerError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        lgpdConsent: data.lgpdConsent,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setServerError(json.error ?? 'Erro ao criar conta. Tente novamente.')
      return
    }

    // Login automático após cadastro
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    router.push('/banco')
    router.refresh()
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-xl">R</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Criar conta</h1>
        <p className="text-slate-400 text-sm">
          20 questões gratuitas por mês · Sem cartão de crédito
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Dr. João Silva"
            autoComplete="name"
            autoFocus
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* LGPD — consentimento obrigatório */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Controller
              control={control}
              name="lgpdConsent"
              render={({ field }) => (
                <Checkbox
                  id="lgpd"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5"
                />
              )}
            />
            <label htmlFor="lgpd" className="text-sm text-slate-300 leading-relaxed cursor-pointer">
              Li e aceito a{' '}
              <Link href="/privacidade" target="_blank" className="text-brand-400 underline hover:text-brand-300">
                Política de Privacidade
              </Link>{' '}
              e os{' '}
              <Link href="/termos" target="_blank" className="text-brand-400 underline hover:text-brand-300">
                Termos de Uso
              </Link>
            </label>
          </div>
          {errors.lgpdConsent && (
            <p className="text-sm text-red-400">{errors.lgpdConsent.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Criar conta gratuita
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Já tem conta?{' '}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Entrar
        </Link>
      </p>

      <p className="text-xs text-slate-600 text-center leading-relaxed">
        Este conteúdo é exclusivamente educacional. Não substitui avaliação clínica médica.
      </p>
    </div>
  )
}
