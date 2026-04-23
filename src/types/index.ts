import type { Tema } from '@/config/constants'

// ============================================================
// TIPOS GLOBAIS DO RETINAAPP
// ============================================================

export type Plano = 'free' | 'pro_mensal' | 'pro_anual' | 'alumni'
export type PlanoStatus = 'active' | 'past_due' | 'canceled' | 'trialing'
export type Gabarito = 'A' | 'B' | 'C' | 'D' | 'E'
export type ModoResposta = 'avulso' | 'simulado' | 'revisao'
export type TipoSimulado = 'pontos_fracos' | 'por_tema' | 'prova_completa'
export type StatusSimulado = 'em_andamento' | 'concluido' | 'abandonado'
export type FonteQuestao = 'original' | 'adaptada_prova' | 'gerada_ia'
export type StatusQuestao = 'rascunho' | 'ativo' | 'aposentado' | 'em_revisao'
export type TipoImagem = 'oct' | 'af' | 'retinografia' | 'octa' | 'icg' | 'eco'

// Questão sem gabarito — exposta para usuários antes de responder
export interface QuestionPublica {
  id: string
  enunciado: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  tema: Tema
  subtema: string
  dificuldade: 1 | 2 | 3
  referencia_id: string | null
  referencia_texto: string | null
  imagem_url: string | null
  imagem_tipo: TipoImagem | null
  imagem_legenda: string | null
}

// Resultado após registrar resposta
export interface RespostaResult {
  correta: boolean
  gabarito: Gabarito
  comentario: string | null // null em modo_prova
  referencia_texto: string | null
}

// Desempenho agregado por tema
export interface DesempenhoTema {
  tema: Tema
  total: number
  acertos: number
  taxa_acerto: number // 0.0 - 1.0
  nivel: 'forte' | 'medio' | 'fraco'
}

// Prontidão estimada para a prova
export interface ProntidaoEstimada {
  percentual: number // 0-100
  total_questoes_respondidas: number
  dias_ate_prova: number | null
}

// Desempenho completo do usuário
export interface DesempenhoCompleto {
  taxa_acerto_geral: number
  total_questoes_respondidas: number
  por_tema: DesempenhoTema[]
  evolucao_semanal: EvolucaoSemanal[]
  prontidao: ProntidaoEstimada
  focos_recomendados: Tema[]
}

// Evolução temporal
export interface EvolucaoSemanal {
  semana: string // ISO date string (início da semana)
  taxa_acerto: number
  total_questoes: number
}

// Paginação genérica
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// Filtros do banco de questões
export interface FiltrosQuestoes {
  tema?: Tema
  subtema?: string
  dificuldade?: 1 | 2 | 3
  comImagem?: boolean
  status?: 'nao_respondida' | 'acertada' | 'errada'
  busca?: string
  page?: number
}

// Erro de rate limit da IA
export class AIRateLimitError extends Error {
  constructor(public readonly chamadas_restantes: number) {
    super(`Limite diário de chamadas à IA atingido. Chamadas restantes: ${chamadas_restantes}`)
    this.name = 'AIRateLimitError'
  }
}

// Sessão estendida do NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      plano: Plano
      plano_status: PlanoStatus
      role: string
    }
  }

  interface User {
    id: string
    plano: Plano
    plano_status: PlanoStatus
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    plano: Plano
    plano_status: PlanoStatus
    role: string
  }
}
