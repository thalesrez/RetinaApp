import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buscarSimulado } from '@/services/simulado.service'

// GET /api/simulados/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  try {
    const { simulado, questoes, respostas } = await buscarSimulado(params.id, session.user.id)
    return NextResponse.json({
      simulado: {
        id: simulado.id,
        tipo: simulado.tipo,
        status: simulado.status,
        modo_prova: simulado.modo_prova,
        temas: simulado.temas,
        iniciado_em: simulado.iniciado_em,
        total: questoes.length,
      },
      questoes,
      // Converte Map para objeto para serialização JSON
      respostas: Object.fromEntries(respostas),
    })
  } catch {
    return NextResponse.json({ error: 'Simulado não encontrado.' }, { status: 404 })
  }
}
