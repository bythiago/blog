# Node LTS fixado para manter paridade entre dev e prod (docs/PLANO.md, Fase 5).
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

# Dependências de produção separadas: a imagem final não carrega tsx, Vite, Vitest etc.
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev

# Build: front + pré-render (npm run build) e conteúdo já disponível para os scripts.
FROM deps AS build
ARG SITE_URL=https://localhost
ARG DOMAIN=localhost
ARG SITE_TITLE="Notas do Thiago"
ARG SITE_DESCRIPTION="Notas técnicas sobre desenvolvimento de software, escritas por Thiago."
ENV NODE_ENV=production \
    SITE_URL=$SITE_URL \
    DOMAIN=$DOMAIN \
    SITE_TITLE=$SITE_TITLE \
    SITE_DESCRIPTION=$SITE_DESCRIPTION
COPY . .
# A API usa tsx no dia a dia; aqui compilamos JS para a imagem não precisar de tsx/Vite.
RUN npm run build \
    && npx tsc -p apps/api/tsconfig.json --noEmit false --declaration false --declarationMap false --sourceMap false --rootDir apps/api/src --outDir /app/api-dist \
    && mkdir -p dist

# Runtime: somente produção, com o conteúdo embutido (ADR 0003).
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    SITE_URL=https://localhost \
    DOMAIN=localhost \
    SITE_TITLE="Notas do Thiago" \
    SITE_DESCRIPTION="Notas técnicas sobre desenvolvimento de software, escritas por Thiago."
WORKDIR /app
# package.json dos workspaces + node_modules (incluindo os aninhados, como chokidar).
COPY --from=prod-deps /app/ ./
COPY --from=build /app/api-dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/dist ./dist
COPY --from=build /app/content ./content
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
