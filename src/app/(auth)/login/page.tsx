'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe sua senha'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/banco'
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setServerError('')
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setServerError('E-mail ou senha incorretos.')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-xl">R</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">RetinaApp</h1>
        <p className="text-slate-400 text-sm">
          Preparatório para a prova de título de especialista
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          {/* Label sempre visível — não usar apenas placeholder */}
          <Label htmlFor="email">E-mail</Label>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/recuperar-senha"
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Entrar
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Não tem conta?{' '}
        <Link href="/cadastro" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Cadastre-se gratuitamente
        </Link>
      </p>
    </div>
  )
}
