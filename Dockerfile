# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copia manifests e instala TODAS as dependências (incluindo dev para gerar cliente Prisma)
COPY package*.json ./
RUN npm ci

# Copia o schema do Prisma e gera o cliente
COPY prisma ./prisma/
RUN npx prisma generate

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o cliente Prisma gerado no builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copia o schema (necessário em runtime para algumas operações)
COPY prisma ./prisma/

# Copia o código-fonte
COPY src ./src/

EXPOSE 9503

CMD ["node", "src/server.js"]
