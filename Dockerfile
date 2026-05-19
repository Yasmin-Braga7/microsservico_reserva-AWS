FROM node:20-alpine AS builder

WORKDIR /app

# Instalar OpenSSL para que o Prisma gere o engine correto
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Instalar OpenSSL no ambiente de execução de produção
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY prisma ./prisma/
COPY src ./src/

EXPOSE 9503

CMD ["node", "src/server.js"]