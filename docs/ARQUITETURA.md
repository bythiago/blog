# Arquitetura

Este documento descreve o estado atual do projeto, conferido no checkout canônico `/home/thiago/Sites/blog`. Os termos seguem `GLOSSARY.md`: **Post**, **Fonte**, **Corpo**, **Resumo**, **Tag**, **Publicação**, **Leitor**, **Página**, **Página de listagem**, **Índice de conteúdo** e **Índice de busca**. Para a referência dos endpoints, veja [`API.md`](./API.md); para o procedimento de produção, veja [`PRODUCAO.md`](./PRODUCAO.md).

## Visão geral do fluxo

```text
content/*.md (Fonte)
  → packages/shared/src/frontmatter.ts + parser.ts (schema e parser Zod)
  → apps/api/src/content/loader.ts + index.ts (Posts validados e ContentIndex em memória)
  → apps/api/src/routes/*.ts + app.ts (Express: /health e /api/*)
  → dist/prerender/*.html (HTML pré-renderizado) + apps/web/dist (SPA React)
  → npm run build (tipos, web, OG image, pré-render, feed/sitemap/robots)
  → Dockerfile multi-stage → imagem com content/ embutido → docker-compose (perfil prod) + Caddy
```

## 1. Da Fonte ao Post validado

- As Fontes são arquivos Markdown em `content/*.md`, com imagens locais em `content/images/`; o frontmatter e o Corpo são lidos por `parsePost` em `packages/shared/src/parser.ts`.
- `packages/shared/src/frontmatter.ts` define o schema Zod: `title`, `date` (ISO `YYYY-MM-DD`), `tags`, `summary`, `slug` (minúsculas, números e hífens) e `image` opcional. Um frontmatter inválido aborta o carregamento com mensagem que aponta o campo.
- O parser extrai o Corpo, remove marcações para produzir o texto do Índice de busca (`extractSearchText`) e calcula `readingTime` (`estimateReadingTime`, 200 palavras/minuto, mínimo de 1 minuto). `toSearchIndexEntry` devolve apenas `slug`, `title`, `summary`, `tags` e `text`.
- `scripts/content-check.ts` (`npm run content:check`) valida todas as Fontes sem gravar nada: frontmatter, slugs duplicados, nomes de arquivo e imagens referenciadas. `scripts/random-post.ts` (`npm run post:random`) gera Fontes com seed, Tags e prefixo opcionais; gerar uma Fonte não Publica o Post.

## 2. Carregamento e Índice de conteúdo na API

- `apps/api/src/content/loader.ts` resolve o diretório de Fontes por `CONTENT_DIR`, `content/` a partir da raiz ou `content/` a partir de `apps/api`, lê os `.md` da raiz do diretório e chama `parsePost` para cada um.
- `apps/api/src/content/index.ts` define `ContentIndex` e `POSTS_PER_PAGE = 10`. `replace` ordena os Posts por `date` decrescente e, em empate, por `slug` em `pt-BR`; mantém mapas por slug e por Tag. `list` devolve `{ posts, page, totalPages, total }` com resumos de `toSummary` (sem Corpo nem texto de busca), `getBySlug` devolve o Post completo, `tags` conta as Tags e `search` devolve o Índice de busca compacto.
- `apps/api/src/index.ts` valida o ambiente com `loadConfig` (`apps/api/src/config.ts`, schema em `packages/shared/src/env.ts`), carrega o índice no boot, inicia o watcher e abre o servidor na `PORT` configurada.
- `apps/api/src/content/watcher.ts` usa `chokidar` **somente** quando `NODE_ENV=development`: mudanças em `content/` recarregam o índice em memória sem reiniciar o processo. Em produção, `startWatcher` devolve `null`.
- `apps/api/src/app.ts` monta as rotas, habilita CORS apenas em development e centraliza erros em JSON. Rotas `/api/*` inexistentes respondem 404 em JSON; JSON malformado responde 400. O detalhamento dos endpoints está em [`API.md`](./API.md).

## 3. Entrega ao Leitor e busca local

- `apps/api/src/static.ts` entrega os artefatos do build: `assets/` com cache de 1 ano e `immutable`, imagens de `content/images/` com cache de 1 hora, HTML pré-renderizado de `dist/prerender/`, e fallback para `apps/web/dist/index.html` (SPA) nas demais rotas. Respostas HTML recebem `Cache-Control: public, max-age=300`.
- `scripts/site.ts` constrói as rotas pré-renderizáveis: `/`, `/sobre`, `/tags`, `/page/:n`, `/posts/:slug` e `/tag/:tag` (com páginas adicionais quando necessário), usando o mesmo `POSTS_PER_PAGE` da API. `scripts/prerender.ts` usa `react-dom/server` com `StaticRouter` e os dados de `apps/web/src/prerender-data.ts` para gerar HTML com `<title>`, description, canonical e Open Graph em `dist/prerender/`. `scripts/feed.ts` gera `feed.xml`, `sitemap.xml` e `robots.txt`; `scripts/og-image.ts` gera `og-image.png`.
- A SPA em `apps/web` consome a API por `apps/web/src/lib/api.ts` e monta as rotas no cliente em `apps/web/src/main.tsx`; o Corpo Markdown é renderizado por `react-markdown` com `rehype-sanitize` (sem `dangerouslySetInnerHTML`). Em dev, `apps/web/vite.config.ts` faz proxy de `/api` para a API (alvo padrão `http://localhost:3000`, sobrescrito por `VITE_API_PROXY_TARGET` no Docker).
- A busca é inteiramente local: `apps/web/src/lib/search.ts` cria um único `Fuse` sobre o índice obtido de `GET /api/search`, com pesos para `title`, `tags`, `summary` e `text`, e `createCachedIndexLoader` guarda a requisição em memória. Não há request por tecla nem índice por Post.

## 4. Build e imagem de produção

- `package.json` define `npm run build` como a sequência `build:types` (`tsc -b`), `build:api`, `build:web` (`vite build`), `build:og`, `build:pages` (pré-render + feed/sitemap/robots). O resultado fica em `apps/api/dist`, `apps/web/dist` e `dist/prerender`.
- `Dockerfile` tem quatro estágios: `deps` (`npm ci`), `prod-deps` (`npm ci --omit=dev`), `build` (`npm run build` com SITE_URL/DOMAIN/SITE_TITLE/SITE_DESCRIPTION como build args) e `runtime` (`node:24-alpine`, somente artefatos de produção). O estágio runtime copia `content/` para dentro da imagem e inicia `node apps/api/dist/index.js`.
- `docker-compose.yml` separa os perfis `dev` e `prod`. No perfil prod, a app publica `API_PORT` (padrão `3000`) com healthcheck em `/health`, e o Caddy publica `HTTP_PORT`/`HTTPS_PORT` (padrão `80`/`443`) com `reverse_proxy app:3000`; `Caddyfile` usa `{$DOMAIN:localhost}` e provisiona TLS automático para domínios públicos.
- `.github/workflows/ci.yml` executa `npm ci`, `lint`, `test`, `content:check`, `format:check` e `build` em Node 24. Não há deploy automático.

## 5. Desenvolvimento versus produção

| Aspecto                 | Desenvolvimento                                                                    | Produção                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Fonte dos Posts         | `content/` montado por bind mount no perfil `dev`                                  | `content/` copiada para a imagem no estágio `runtime`                           |
| Atualização do índice   | watcher `chokidar` recarrega o `ContentIndex` sem reiniciar                        | nenhum watcher; índice carregado apenas no boot                                 |
| API                     | `npm run dev -w apps/api` (`tsx watch`); CORS liberado; porta `3000` (`API_PORT`)  | JavaScript compilado; sem CORS; healthcheck e `restart: unless-stopped`         |
| Frontend                | `npm run dev -w apps/web` (Vite em `5173`, proxy `/api`); sem HTML pré-renderizado | build do Vite servido pela mesma imagem; HTML de `dist/prerender/` com fallback |
| Acesso externo          | direto na API e no Vite                                                            | Caddy na frente da app, com TLS automático                                      |
| Publicação de novo Post | alterar a Fonte basta para ver no dev (watcher)                                    | exige rebuild/redeploy da imagem (ADR 0003)                                     |

Para reproduzir o fluxo de dev sem Docker, use `npm run dev -w apps/api` e `npm run dev -w apps/web` em terminais separados; `npm run dev` na raiz apenas observa os tipos (`tsc -b --watch`). Os comandos de validação e os pré-requisitos estão no `README.md`.

## 6. Limites deliberados

- **Sem CMS, banco de dados ou edição em runtime**: a Fonte versionada é a origem dos Posts e a Publicação acontece por commit/PR ([ADR 0001](./adr/0001-markdown-como-fonte-da-verdade.md)).
- **Sem SSR permanente**: o HTML indexável é artefato do build; a SPA React consome a API em runtime, mas o servidor não renderiza cada requisição ([ADR 0002](./adr/0002-spa-com-pre-render.md)).
- **Conteúdo imutável na imagem**: não há volume de `content/` em produção, então Publicar exige nova imagem ([ADR 0003](./adr/0003-conteudo-embutido-na-imagem.md)).
- **Busca local com índice único**: adequada ao volume atual de Posts; não há serviço de busca no servidor nem requisições por tecla.

## Decisões relacionadas

- [ADR 0001 — Markdown versionado como fonte da verdade](./adr/0001-markdown-como-fonte-da-verdade.md)
- [ADR 0002 — SPA com pré-render no build](./adr/0002-spa-com-pre-render.md)
- [ADR 0003 — Conteúdo embutido na imagem de produção](./adr/0003-conteudo-embutido-na-imagem.md)
- [Referência da API](./API.md) · [Runbook de produção](./PRODUCAO.md) · [Linguagem ubíqua](../GLOSSARY.md)
