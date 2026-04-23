-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "crm" TEXT,
    "especialidade" TEXT NOT NULL DEFAULT 'retina_vitreo',
    "estado" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "plano" TEXT NOT NULL DEFAULT 'free',
    "plano_status" TEXT NOT NULL DEFAULT 'active',
    "plano_expira" TIMESTAMP(3),
    "pagarme_customer_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "lgpd_consent_at" TIMESTAMP(3),
    "lgpd_consent_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "alternativa_a" TEXT NOT NULL,
    "alternativa_b" TEXT NOT NULL,
    "alternativa_c" TEXT NOT NULL,
    "alternativa_d" TEXT NOT NULL,
    "alternativa_e" TEXT NOT NULL,
    "gabarito" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "subtema" TEXT NOT NULL,
    "dificuldade" INTEGER NOT NULL DEFAULT 2,
    "dificuldade_real" DOUBLE PRECISION,
    "referencia_id" TEXT,
    "referencia_texto" TEXT,
    "imagem_url" TEXT,
    "imagem_tipo" TEXT,
    "imagem_legenda" TEXT,
    "fonte" TEXT NOT NULL DEFAULT 'original',
    "ano_origem" INTEGER,
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "comentario_ia" TEXT,
    "fallback_comment" TEXT,
    "comentario_gerado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_answers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL,
    "tempo_ms" INTEGER NOT NULL,
    "valida" BOOLEAN NOT NULL DEFAULT true,
    "simulado_id" TEXT,
    "modo" TEXT NOT NULL DEFAULT 'avulso',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulado_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "temas" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "modo_prova" BOOLEAN NOT NULL DEFAULT false,
    "iniciado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluido_em" TIMESTAMP(3),
    "tempo_total_segundos" INTEGER,
    "seed" TEXT NOT NULL,

    CONSTRAINT "simulado_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulado_items" (
    "id" TEXT NOT NULL,
    "simulado_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "simulado_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notif_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lembrete_estudo" BOOLEAN NOT NULL DEFAULT true,
    "horario_lembrete" TEXT NOT NULL DEFAULT '20:00',
    "notif_push_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notif_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_plano_plano_status_idx" ON "users"("plano", "plano_status");

-- CreateIndex
CREATE INDEX "questions_tema_status_idx" ON "questions"("tema", "status");

-- CreateIndex
CREATE INDEX "questions_dificuldade_status_idx" ON "questions"("dificuldade", "status");

-- CreateIndex
CREATE INDEX "questions_revisado_status_idx" ON "questions"("revisado", "status");

-- CreateIndex
CREATE INDEX "user_answers_user_id_question_id_idx" ON "user_answers"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "user_answers_user_id_created_at_idx" ON "user_answers"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_answers_question_id_correta_idx" ON "user_answers"("question_id", "correta");

-- CreateIndex
CREATE INDEX "simulado_sessions_user_id_status_idx" ON "simulado_sessions"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "simulado_items_simulado_id_ordem_key" ON "simulado_items"("simulado_id", "ordem");

-- CreateIndex
CREATE INDEX "access_logs_user_id_created_at_idx" ON "access_logs"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notif_preferences_user_id_key" ON "notif_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulado_sessions" ADD CONSTRAINT "simulado_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulado_items" ADD CONSTRAINT "simulado_items_simulado_id_fkey" FOREIGN KEY ("simulado_id") REFERENCES "simulado_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulado_items" ADD CONSTRAINT "simulado_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notif_preferences" ADD CONSTRAINT "notif_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
