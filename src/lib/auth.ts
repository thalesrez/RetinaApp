import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { AUTH } from '@/config/constants'
import type { Plano, PlanoStatus } from '@/types'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
    maxAge: AUTH.SESSION_MAX_AGE,
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password_hash: true,
            plano: true,
            plano_status: true,
            role: true,
            deleted_at: true,
          },
        })

        if (!user || user.deleted_at || !user.password_hash) return null

        const passwordOk = await bcrypt.compare(credentials.password, user.password_hash)
        if (!passwordOk) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plano: user.plano as Plano,
          plano_status: user.plano_status as PlanoStatus,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.plano = user.plano
        token.plano_status = user.plano_status
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.plano = token.plano
        session.user.plano_status = token.plano_status
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
