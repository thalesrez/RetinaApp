import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = (req as NextRequest & { nextauth: { token: { plano?: string; role?: string } | null } }).nextauth.token

    // Protege /tutor — apenas plano Pro
    if (req.nextUrl.pathname.startsWith('/tutor')) {
      if (token?.plano === 'free' || token?.plano === 'alumni') {
        return NextResponse.redirect(new URL('/planos?reason=tutor', req.url))
      }
    }

    // Protege rotas /admin/* — apenas role admin
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/banco', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/banco/:path*',
    '/simulado/:path*',
    '/progresso/:path*',
    '/tutor/:path*',
    '/ranking/:path*',
    '/perfil/:path*',
    '/admin/:path*',
  ],
}
