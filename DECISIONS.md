# DECISIONS.md — Registro de Decisões Arquiteturais RetinaApp

Formato: Data | Decisão | Razão | Alternativas descartadas | Localização no código

## Decisões Fundacionais

### Stack: Monolito modular (Next.js + Fastify no mesmo repo)
Razão: Fundador não tem dev fixo; Railway e Vercel simplificam deploy;
monolito modular permite crescer para microsserviços sem reescrever tudo.
Alternativas descartadas: Microsserviços (complexidade prematura), Supabase (menos controle).

### JWT expiry: 7 dias
Razão: Candidatos estudam diariamente. Sessão semanal é aceitável.
Relogar toda hora interrompe o fluxo de estudo.
Localização: config/constants.ts → AUTH.JWT_EXPIRY_DAYS

### Limite IA: 30 chamadas/dia/usuário
Razão: Sessão de estudo intensa usa 10-15 chamadas/hora.
30/dia cobre uso legítimo; acima disso = risco de custo abusivo.
Localização: config/constants.ts → AI.MAX_CALLS_PER_USER_PER_DAY

### Modelo IA: claude-sonnet-4-6 (fixo)
Razão: Balance custo/performance validado. Modelos mais novos só
trocados após validação clínica do fundador.
Localização: config/constants.ts → AI.MODEL

### Banco de dados: PostgreSQL via Prisma
Razão: Relacional necessário para joins de desempenho por tema/usuário.
Prisma garante type-safety e migrations gerenciadas.

### Redis: rate limiting + filas de e-mail
Razão: Rate limiting de IA requer atomic operations. Redis TTL
nativo simplifica a lógica sem cron jobs.

### Pagamentos: Pagar.me
Razão: Único gateway brasileiro com PIX recorrente nativo,
suporte a plano mensal + anual sem código extra.

### Imagens: AWS S3 + CloudFront
Razão: Imagens clínicas (OCT, AF, retinografia) podem ter 2-5MB.
S3 + CloudFront garante entrega rápida com cache no edge.

### Mobile-first obrigatório
Razão: Candidatos estudam no celular durante plantão e deslocamento.
Métricas de mercado: >60% do tráfego de plataformas de estudo é mobile.

### LGPD: soft delete obrigatório
Razão: Histórico de respostas é necessário para cálculo de desempenho.
Hard delete destruiria dados analíticos legítimos.
Usuários podem solicitar anonimização; dados pseudonimizados são preservados.

### Ranking: proteção anti-manipulação
Razão: Mínimo 50 respostas válidas (valida=true) e apenas primeira tentativa
por questão por usuário. Respostas em < 3s são inválidas.
Localização: config/constants.ts → QUESTOES.TEMPO_MINIMO_RESPOSTA_MS

### Algoritmo de simulado personalizado
Razão: 60% pontos fracos + 30% não vistas + 10% aleatório garante foco em
lacunas sem tornar o simulado 100% previsível.
Localização: config/constants.ts → QUESTOES.ALGORITMO_PESO_*

### Seed de simulado: userId + data
Razão: Reprodutível para debug sem repetir o mesmo simulado no dia seguinte.
Localização: src/services/simulados.service.ts
