# RetinaApp — Contexto Permanente para Claude Code

## Identidade do Projeto
Plataforma SaaS de preparação para a prova de título da SBRV.
Nome: RetinaApp | Fundador: Thales Rezende (retinólogo)
Repositório: retinaapp | Ambiente atual: development

## Stack Obrigatório (nunca mudar sem atualizar DECISIONS.md)
- Frontend: Next.js 14 + TypeScript + Tailwind + Shadcn/ui → Vercel
- Backend: Node.js 22 + Fastify + PostgreSQL + Redis → Railway
- IA: claude-sonnet-4-6 (Anthropic API, streaming, prompt caching)
- Pagamentos: Pagar.me (PIX + cartão recorrente)
- Mobile-first: viewport 390px como base em TODAS as telas
- Testes: Jest + Supertest (backend) · Playwright (E2E frontend)
- CI/CD: GitHub Actions (obrigatório desde Sprint 0)

## Regras Absolutas de Código

### NUNCA fazer
- Definir valores numéricos ou strings mágicas inline — sempre de config/constants.ts
- Fazer `import { Prisma } from '@prisma/client'` fora de prisma.ts
- Commitar .env.local ou qualquer variável de ambiente
- Usar `any` no TypeScript
- Criar lógica de negócio dentro de componentes React
- Chamar a API Anthropic sem verificar rate limit no Redis antes
- Retornar erros técnicos (stack trace) para o usuário
- Usar font-size < 16px em inputs (causa zoom no iOS)
- Usar height < 48px em botões (touch target mínimo)

### SEMPRE fazer
- Importar constantes de config/constants.ts
- Adicionar comentário // RAZÃO: ... em toda decisão não óbvia
- Escrever o teste junto com a feature (nunca depois)
- Atualizar DECISIONS.md ao tomar decisão arquitetural
- Usar mobile-first (estilizar 390px primeiro, então md: lg:)
- Implementar fallback em toda chamada à API Anthropic
- Fazer soft delete (deleted_at) — nunca hard delete de usuário
- Logar acesso a dados de usuário em access_logs (LGPD)

## Limites da IA
- MAX_CALLS_PER_USER_PER_DAY: 30 (config/constants.ts)
- Verificar via Redis ANTES de cada chamada
- Fallback obrigatório se API indisponível ou timeout (10s)
- Nunca citar referências fora de REFERENCIAS_APROVADAS
- Nunca retornar stack trace ou erro técnico ao usuário

## Base Científica Obrigatória
Toda questão, comentário ou conteúdo gerado pela IA DEVE ser baseado em:
1. Ryan's Retina 6ª ed. 2018 (Schachat)
2. Gass' Atlas 5ª ed. 2012 (Agarwal)
3. The Retinal Atlas 2ª ed. 2016 (Yannuzzi)
4. AAO BCSC Section 12 Retina 2017-2018
5. CBO Série Oftalmologia Brasileira 3ª ed.
6. E-book e EAD SBRV (sbrv.org)
7. Lista de 17 artigos do Edital SBRV 2026 (ver constants.ts)

A IA NUNCA inventa referências. Se não souber a fonte: "conforme literatura atual" sem citar estudo.

## LGPD — Obrigatório
- Soft delete: campo deleted_at (nunca hard delete de usuário)
- Consentimento explícito no cadastro com timestamp
- Access log: registrar toda leitura de dados de usuário
- Portabilidade: endpoint GET /api/usuarios/me/data
- Política de privacidade: /privacidade

## CFM e SBRV — Compliance
- A plataforma NÃO diagnostica doenças nem prescreve tratamentos
- Todo conteúdo é exclusivamente educacional para preparação para exame
- Nenhum conteúdo clínico substitui avaliação médica presencial
- Rodapé obrigatório: "Este conteúdo é exclusivamente educacional. Não substitui avaliação clínica."
- Marca registrada SBRV: não usar o nome ou logo sem autorização formal
- Nome do exame: "prova de título de especialista" — não "prova da SBRV"
- Questões das provas: usar conteúdo reformulado (não reprodução literal)

## 3 Ambientes
- dev: desenvolvimento local (localhost:3000)
- staging: Railway sbrv-staging (testes de integração)
- prod: Railway sbrv-prod + Vercel (produção)
Migrations em produção: APENAS entre 08h-09h ou 23h-00h (fora do horário de estudo)

## Parar e Pedir Ajuda
Se não conseguir resolver um bug em 3 tentativas:
1. Documente: o que acontece, o que deveria acontecer, o que já tentou
2. Avise o fundador
3. Não tente soluções cada vez mais complexas — isso gera context drift
