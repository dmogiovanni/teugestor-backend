# Imagem base oficial do Node.js
FROM node:20-alpine AS build

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Build do TypeScript
RUN npm run build

# ---
# Imagem final para produção
FROM node:20-alpine

WORKDIR /app

# Copia apenas o necessário da imagem de build
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Instala apenas dependências de produção
RUN npm install --only=production

# Configurar variáveis de ambiente
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_KEY
ARG SUPABASE_ANON_KEY
ARG PORT

ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV PORT=$PORT

# Expor a porta configurada
EXPOSE $PORT

# Iniciar a aplicação
CMD ["node", "dist/index.js"]