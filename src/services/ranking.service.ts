import { prisma } from '@/lib/prisma'

const MIN_RESPOSTAS_RANKING = 20 // Mínimo de respostas válidas para aparecer no ranking

export interface RankingEntry {
  posicao: number
  nome: string       // Primeiro nome + inicial sobrenome (privacidade)
  taxa_acerto: number
  total_questoes: number
  destaque?: boolean // true = usuário atual
}

export interface RankingResult {
  top: RankingEntry[]
  posicao_usuario: number | null
  taxa_usuario: number | null
  total_usuarios: number
}

// Anonimiza nome: "João Silva" → "João S."
function anonimizarNome(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0]
  return `${partes[0]} ${partes[partes.length - 1][0]}.`
}

export async function getRanking(params: {
  userId: string
  page?: number
  pageSize?: number
}): Promise<RankingResult> {
  const { userId, page = 1, pageSize = 20 } = params

  // Busca acertos por usuário com query raw para eficiência
  const dados = await prisma.$queryRaw<
    { user_id: string; total: bigint; acertos: bigint }[]
  >`
    SELECT
      user_id,
      COUNT(*) AS total,
      SUM(CASE WHEN correta = true THEN 1 ELSE 0 END) AS acertos
    FROM user_answers
    WHERE valida = true
    GROUP BY user_id
    HAVING COUNT(*) >= ${MIN_RESPOSTAS_RANKING}
    ORDER BY (SUM(CASE WHEN correta = true THEN 1 ELSE 0 END)::float / COUNT(*)) DESC
  `

  // Busca nomes dos usuários no ranking
  const userIds = dados.map((d) => d.user_id)
  const usuarios = await prisma.user.findMany({
    where: { id: { in: userIds }, deleted_at: null },
    select: { id: true, name: true },
  })
  const nomeMap = new Map(usuarios.map((u) => [u.id, u.name]))

  // Monta ranking com posições
  const rankingCompleto: RankingEntry[] = dados.map((d, i) => {
    const total = Number(d.total)
    const acertos = Number(d.acertos)
    return {
      posicao: i + 1,
      nome: anonimizarNome(nomeMap.get(d.user_id) ?? 'Usuário'),
      taxa_acerto: total > 0 ? acertos / total : 0,
      total_questoes: total,
      destaque: d.user_id === userId,
    }
  })

  // Posição e taxa do usuário atual
  const entradaUsuario = rankingCompleto.find((e) => e.destaque)

  // Paginação
  const skip = (page - 1) * pageSize
  const top = rankingCompleto.slice(skip, skip + pageSize)

  return {
    top,
    posicao_usuario: entradaUsuario?.posicao ?? null,
    taxa_usuario: entradaUsuario?.taxa_acerto ?? null,
    total_usuarios: rankingCompleto.length,
  }
}
