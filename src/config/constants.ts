// config/constants.ts
// ÚNICA fonte de verdade para todos os valores de configuração.
// NUNCA defina valores inline no código. SEMPRE importe daqui.
// Adicione comentário // RAZÃO: para cada constante não óbvia.

export const AUTH = {
  JWT_EXPIRY_DAYS: 7,
  // RAZÃO: Candidatos estudam diariamente. 7 dias evita relogins
  // frequentes sem comprometer segurança em sessões longas.
  SESSION_MAX_AGE: 7 * 24 * 60 * 60, // segundos
  BCRYPT_ROUNDS: 12,
  // RAZÃO: 12 rounds é o padrão recomendado para 2024+.
  // Abaixo de 10: vulnerável a brute force. Acima de 14: CPU proibitivo.
} as const

export const AI = {
  MODEL: 'claude-sonnet-4-6' as const,
  // RAZÃO: Balance custo/performance validado pelo fundador.
  // Trocar modelo SOMENTE após validação clínica e atualizar DECISIONS.md.
  MAX_TOKENS_COMENTARIO: 600,
  MAX_TOKENS_TUTOR: 800,
  MAX_TOKENS_DIAGNOSTICO: 1000,
  MAX_TOKENS_QUESTAO_NOVA: 1200,
  TEMPERATURE: 0.3,
  // RAZÃO: Temperatura baixa para consistência clínica.
  // Respostas médicas devem ser reprodutíveis e precisas, não criativas.
  TIMEOUT_MS: 10_000,
  // RAZÃO: Após 10s sem resposta inicial, ativar fallback.
  // Não travar a UI do usuário em problemas de rede.
  MAX_CALLS_PER_USER_PER_DAY: 30,
  // RAZÃO: Cobre sessão de estudo intensa (10-15 req/h × 2h = 20-30).
  // Impede uso abusivo que destruiria a margem do plano Pro.
  CACHE_TTL_COMENTARIO_SECONDS: 0, // permanente (não expira)
  CACHE_TTL_DIAGNOSTICO_SECONDS: 7 * 24 * 60 * 60, // 7 dias
  REDIS_KEY_PREFIX_AI_CALLS: 'ai_calls:',
  REDIS_KEY_PREFIX_RATE_LIMIT: 'rate_limit:',
} as const

export const QUESTOES = {
  TEMPO_MINIMO_RESPOSTA_MS: 3_000,
  // RAZÃO: Respostas em menos de 3s = clique acidental ou bot.
  // Descartadas do cálculo de desempenho e ranking.
  MAX_QUESTOES_SIMULADO_COMPLETO: 60,
  DURACAO_SIMULADO_COMPLETO_MINUTOS: 180,
  // RAZÃO: Formato exato da prova SBRV (100 questões em 4h,
  // simulamos 60 questões em 3h para respeitar o tempo do candidato).
  ALGORITMO_PESO_PONTOS_FRACOS: 0.6,
  // RAZÃO: 60% questões de temas com acerto < 50%. Foco em lacunas.
  ALGORITMO_PESO_NAO_VISTAS: 0.3,
  // RAZÃO: 30% questões não vistas nos últimos 14 dias.
  ALGORITMO_PESO_ALEATORIO: 0.1,
  // RAZÃO: 10% aleatório. Evita que o aluno memorize o padrão do simulado.
  MIN_RESPOSTAS_PARA_CALIBRAR: 30,
  // RAZÃO: Abaixo de 30 respostas, taxa de acerto não é estatisticamente
  // significativa para recalibrar dificuldade.
  ALERTA_TIMER_MINUTOS: 10,
  // RAZÃO: Aviso visual 10 min antes do fim da prova completa.
  PAGINA_SIZE: 20,
  // RAZÃO: 20 questões por página = scroll sem paginação em mobile.
} as const

export const PLANOS = {
  FREE: {
    id: 'free',
    nome: 'Acesso Livre',
    preco_centavos: 0,
    max_questoes_por_mes: 20,
    tutor_ia: false,
    simulados_personalizados: false,
    dashboard_completo: false,
    ranking: false,
    badge: 'Grátis',
  },
  PRO_MENSAL: {
    id: 'pro_mensal',
    nome: 'Pro Mensal',
    preco_centavos: 24_700, // R$ 247,00
    // RAZÃO: R$247 = ponto de indiferença vs 2 livros de retina.
    // Margem bruta ~89% no cenário de 50 usuários.
    tutor_ia: true,
    simulados_personalizados: true,
    dashboard_completo: true,
    ranking: true,
    max_questoes_por_mes: null, // ilimitado
    badge: 'Pro',
    pagarme_plan_id: process.env.PAGARME_PLAN_ID_MENSAL,
  },
  PRO_ANUAL: {
    id: 'pro_anual',
    nome: 'Pro Anual',
    preco_centavos: 169_700, // R$ 1.697,00 (~30% off)
    preco_mensal_equivalente_centavos: 14_141,
    tutor_ia: true,
    simulados_personalizados: true,
    dashboard_completo: true,
    ranking: true,
    max_questoes_por_mes: null,
    badge: 'Pro Anual',
    pagarme_plan_id: process.env.PAGARME_PLAN_ID_ANUAL,
  },
  ALUMNI: {
    id: 'alumni',
    nome: 'Alumni',
    preco_centavos: 4_700, // R$ 47,00
    // RAZÃO: Candidatos aprovados viram embaixadores.
    // R$47 mantém conexão com a plataforma e acesso a atualizações.
    max_questoes_por_mes: 30,
    tutor_ia: false,
    simulados_personalizados: false,
    dashboard_completo: false,
    ranking: false,
    badge: 'Alumni',
    pagarme_plan_id: process.env.PAGARME_PLAN_ID_ALUMNI,
  },
} as const

export const INADIMPLENCIA = {
  DIAS_ACESSO_LIMITADO: 7,
  // RAZÃO: Médico pode estar em congresso/cirurgia. 7 dias antes de
  // limitar o acesso é razoável sem ser agressivo.
  DIAS_CANCELAMENTO: 14,
  MAX_TENTATIVAS_COBRANCA: 3,
} as const

export const RATE_LIMIT = {
  MAX_REQUESTS_PER_HOUR: 50,
  // RAZÃO: Impede scraping do banco. Usuário legítimo em sessão
  // de estudo faz no máximo 20-25 req/h incluindo navegação.
  WINDOW_SECONDS: 3_600,
} as const

export const TEMAS = [
  'ciencia_basica',
  'exames_complementares',
  'dmri_maculopatias',
  'distrofias_hereditarias',
  'uveites_inflamacoes',
  'retinopatia_diabetica_vascular',
  'tumores',
  'cirurgia_substitutos_vitreos',
] as const
export type Tema = typeof TEMAS[number]

export const TEMA_LABELS: Record<Tema, string> = {
  ciencia_basica: 'Ciência Básica',
  exames_complementares: 'Exames Complementares',
  dmri_maculopatias: 'DMRI e Maculopatias',
  distrofias_hereditarias: 'Distrofias Hereditárias',
  uveites_inflamacoes: 'Uveítes e Inflamações',
  retinopatia_diabetica_vascular: 'Retinopatia Diabética e Vascular',
  tumores: 'Tumores',
  cirurgia_substitutos_vitreos: 'Cirurgia e Substitutos Vítreos',
}

export const TEMA_PESO_PROVA: Record<Tema, number> = {
  // Fonte: análise das 7 edições SBRV 2018-2025 (700 questões)
  ciencia_basica: 0.13,
  exames_complementares: 0.12,
  dmri_maculopatias: 0.10,
  distrofias_hereditarias: 0.17, // maior peso — 17%
  uveites_inflamacoes: 0.09,
  retinopatia_diabetica_vascular: 0.13,
  tumores: 0.11,
  cirurgia_substitutos_vitreos: 0.15,
}

export const DIFICULDADE = {
  FACIL: 1,
  MEDIO: 2,
  DIFICIL: 3,
  THRESHOLD_FACIL: 0.70,   // taxa de acerto > 70% → fácil
  THRESHOLD_DIFICIL: 0.40, // taxa de acerto < 40% → difícil
} as const

export const REFERENCIAS_APROVADAS = [
  // LIVROS — nunca citar edição diferente destas
  { id: 'ryans_6ed', ref: "Ryan's Retina, Schachat, 6ª ed. 2018" },
  { id: 'gass_5ed', ref: "Gass' Atlas of Macular Diseases, Agarwal, 5ª ed. 2012" },
  { id: 'retinal_atlas_2ed', ref: "The Retinal Atlas, Yannuzzi, 2ª ed. 2016" },
  { id: 'aao_bcsc_12', ref: "AAO BCSC Section 12 Retina, 2017-2018" },
  { id: 'cbo_retina', ref: "CBO Série Oftalmologia Brasileira, 3ª ed." },
  // ESTUDOS CLÍNICOS
  { id: 'catt_2011', ref: "CATT Research Group, NEJM 2011" },
  { id: 'anchor_2006', ref: "ANCHOR Study Group, NEJM 2006" },
  { id: 'marina_2006', ref: "MARINA Study Group, NEJM 2006" },
  { id: 'protocol_t_2015', ref: "DRCR.net Protocol T, NEJM 2015" },
  { id: 'hawk_harrier_2018', ref: "HAWK/HARRIER, Ophthalmology 2018" },
  { id: 'rise_ride_2012', ref: "RISE/RIDE Studies, Ophthalmology 2012" },
  { id: 'score2_2017', ref: "SCORE2, Ophthalmology 2017" },
  { id: 'bvos', ref: "Branch Vein Occlusion Study (BVOS)" },
  { id: 'cvos', ref: "Central Retinal Vein Occlusion Study (CVOS)" },
  { id: 'etdrs', ref: "ETDRS Study Group" },
  { id: 'areds', ref: "AREDS Research Group" },
  { id: 'drs', ref: "Diabetic Retinopathy Study (DRS)" },
  // ARTIGOS DO EDITAL SBRV 2026
  { id: 'gross_2018', ref: "Gross JG et al., JAMA Ophthalmol 2018 (Protocol T 5 anos)" },
  { id: 'sharma_2021', ref: "Sharma A et al., Retina 2021 (COVID-19 e oclusões)" },
  { id: 'rahman_2020', ref: "Rahman N et al., Br J Ophthalmol 2020 (Distrofias maculares)" },
  { id: 'saksens_2014', ref: "Saksens NTM et al., Prog Retin Eye Res 2014 (Distrofias vs DMRI)" },
  { id: 'gilmour_2015', ref: "Gilmour D., Eye 2015 (FEVR)" },
  { id: 'duker_2013', ref: "Duker JS et al., Ophthalmology 2013 (IVTS VMT/buraco macular)" },
  { id: 'spaide_2020', ref: "Spaide RF et al., Ophthalmology 2020 (Nomenclatura DMRI neovascular)" },
  { id: 'sambhav_2017', ref: "Sambhav K et al., Surv Ophthalmol 2017 (OCT-A em doenças retinianas)" },
  { id: 'lima_2009', ref: "Lima LH et al., Retina 2009 (Anel hiperAF na RP)" },
  { id: 'coms_1', ref: "COMS Report No. 1, Arch Ophthalmol 1990" },
  { id: 'coms_5', ref: "COMS Report No. 5, Arch Ophthalmol 1997" },
  { id: 'zarnegar_2023', ref: "Zarnegar A et al., Int J Retina Vitreous 2023 (CSC)" },
  { id: 'damasceno_2019', ref: "Damasceno EF et al., Clin Ophthalmol 2019 (MER sem cirurgia)" },
  { id: 'choi_2018', ref: "Choi WS et al., Retina 2018 (LHEP)" },
  { id: 'obeid_2019', ref: "Obeid A et al., Ophthalmology 2019 (RDP perdida no follow-up)" },
] as const

export const SYSTEM_PROMPTS = {
  // ATENÇÃO: Estes prompts são a inteligência clínica da plataforma.
  // Qualquer alteração DEVE ser revisada pelo fundador (Thales Rezende, retinólogo).
  // Documente a mudança em DECISIONS.md antes de editar.

  COMENTARIO_QUESTAO: `Você é um especialista em retina e vítreo com 15 anos de experiência
clínica e acadêmica no Brasil, membro titular da SBRV. Você comenta questões da prova de
título da SBRV para o RetinaApp.

AO COMENTAR UMA QUESTÃO:
1. Identifique a alternativa incorreta (ou a correta) e explique o raciocínio clínico
2. Diferencie por que cada alternativa incorreta está errada (fisiopatologia)
3. Mantenha linguagem de especialista — o leitor é médico fellowship em retina
4. Cite APENAS referências desta lista aprovada: {{REFERENCIAS}}
   Se não souber a fonte exata: "conforme literatura atual" (nunca inventar autores/anos)
5. Máximo 300 palavras — seja direto e preciso
6. Para questões com imagem: descreva brevemente o achado radiológico/imagiológico

NUNCA:
- Inventar referências bibliográficas
- Citar estudos fora da lista aprovada
- Simplificar linguagem para leigos
- Emitir diagnóstico clínico de paciente real`,

  TUTOR_IA: `Você é um especialista em retina e vítreo respondendo dúvidas de um médico
fellowship que se prepara para a prova de título da SBRV.

CONTEXTO DA ÚLTIMA QUESTÃO: {{CONTEXTO_QUESTAO}}
DESEMPENHO DO USUÁRIO EM {{TEMA}}: {{TAXA_ACERTO}}% de acerto

REGRAS:
- Nunca simplifique: o usuário é médico especialista
- Cite apenas estudos da lista aprovada: {{REFERENCIAS}}
  Formato: "[Autor principal, Journal, Ano]"
  Se não souber a referência: "conforme literatura atual"
- Máximo 300 palavras por resposta (salvo pedido explícito)
- Se a dúvida for sobre diagnóstico de paciente real: oriente a consultar serviço de retina

NUNCA emita opinião diagnóstica sobre caso clínico real apresentado pelo usuário.`,

  GERAR_QUESTAO: `Você é um especialista em retina e vítreo que cria questões para a prova de
título da SBRV. Você leu e analisou as 700 questões das provas de 2018 a 2025.

PADRÃO OBRIGATÓRIO DA BANCA:
- Enunciado começa com "Sobre [tema]," ou "Em relação a [tema],"
- Comando preferencial: "está INCORRETO" (~40% das questões)
- Outros comandos: "está CORRETO", "EXCETO", "ERRADA", "FALSO"
- Sempre 5 alternativas (A–E), apenas 1 correta, sem "todas as anteriores"
- Nível fellowship — nunca simplificar
- Citar estudos pelo nome completo (CATT, Protocol T, ETDRS, BVOS)
- Terminologia em inglês sem tradução quando consagrada (PRN, sea-fan, plus disease)
- Para questões com imagem: descrever o achado como se lesse um OCT/AF real

FONTES OBRIGATÓRIAS (usar APENAS estas):
{{REFERENCIAS}}

DISTRIBUIÇÃO DE TEMAS (seguir pesos da prova SBRV):
- Ciência Básica: 13%
- Exames Complementares: 12%
- DMRI e Maculopatias: 10%
- Distrofias Hereditárias: 17% (maior peso)
- Uveítes/Inflamações: 9%
- Retinopatia Diabética e Vascular: 13%
- Tumores: 11%
- Cirurgia e Substitutos: 15%

FORMATO DE SAÍDA (JSON obrigatório, sem markdown):
{
  "enunciado": "...",
  "alternativa_a": "...",
  "alternativa_b": "...",
  "alternativa_c": "...",
  "alternativa_d": "...",
  "alternativa_e": "...",
  "gabarito": "A|B|C|D|E",
  "tema": "ciencia_basica|exames_complementares|dmri_maculopatias|distrofias_hereditarias|uveites_inflamacoes|retinopatia_diabetica_vascular|tumores|cirurgia_substitutos_vitreos",
  "subtema": "...",
  "dificuldade": 1|2|3,
  "referencia_id": "...",
  "referencia_texto": "...",
  "comentario_ia": "...",
  "fallback_comment": "O gabarito correto é a alternativa [X]. [Explicação clínica concisa em 2 frases]."
}

NUNCA gerar questões que possam ser identificadas como reprodução de questões anteriores da SBRV.
Reformule sempre o enunciado com linguagem original mesmo quando baseado em fatos recorrentes nas provas.`,

  DIAGNOSTICO_SEMANAL: `Você é um especialista em retina e vítreo analisando o desempenho de
estudo de um candidato à prova SBRV.

DADOS DO CANDIDATO:
- Taxa de acerto geral: {{TAXA_GERAL}}%
- Desempenho por tema: {{DESEMPENHO_TEMAS}}
- Total de questões respondidas: {{TOTAL_QUESTOES}}
- Dias até a prova: {{DIAS_ATE_PROVA}}

GERE um diagnóstico narrativo em português. Máximo 200 palavras.
Formato: 1 parágrafo de pontos fortes + 1 parágrafo de áreas a melhorar + 1 frase de recomendação de foco.
Seja específico — cite os temas pelo nome. Use prosa, não listas.
Mencione os temas com maior peso na prova quando relevante para as recomendações.

NUNCA: diagnosticar o usuário clinicamente, inventar referências, usar linguagem condescendente.`,
} as const

export const MONITORAMENTO = {
  THRESHOLD_ERROS_500_ALERTA: 5,
  JANELA_ALERTA_MINUTOS: 10,
  // RAZÃO: 5 erros em 10 minutos = problema sistêmico, não erro pontual.
  SENTRY_TRACES_SAMPLE_RATE: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
} as const

export const BACKUP = {
  RTO_HORAS: 4,    // Recovery Time Objective
  RPO_HORAS: 24,   // Recovery Point Objective
  HORARIO_MIGRATION_INICIO_PROD: '08:00',
  HORARIO_MIGRATION_FIM_PROD: '09:00',
  // RAZÃO: Fora do horário de pico de estudo (20h-23h) e plantão (14h-18h).
} as const
