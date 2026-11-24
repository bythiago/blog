# Plano — Blog "Notas do Thiago"

- **Status**: aprovado (entendimento compartilhado confirmado em 2026-11-23)
- **Workspace**: `/home/thiago/Sites/blog` (greenfield, vazio, sem Git)
- **Objetivo**: criar um blog pessoal técnico em pt-BR com Node/Express no back, React no front, Docker para dev/prod e design editorial moderno.

---

## 1. Decisões consolidadas

| Área           | Decisão                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Propósito      | Blog pessoal de conteúdo técnico, autor único, sem painel administrativo                                                   |
| Idioma         | pt-BR na interface e no conteúdo; strings centralizadas em um módulo para permitir i18n futuro                             |
| Stack          | TypeScript em todo o código, Node LTS, Vite, Express, npm workspaces                                                       |
| Renderização   | SPA React consumindo REST; Express entrega o build e HTML pré-renderizado                                                  |
| Conteúdo       | Markdown + frontmatter versionados no repo; publicação via commit/PR; sem banco, CMS ou auth                               |
| Features MVP   | Listagem paginada, post individual, tags, busca, RSS, Sobre, dark mode, tempo de leitura, responsivo                       |
| Fora do MVP    | Comentários, newsletter, multi-autor, autenticação, CMS, banco de dados                                                    |
| Design         | Editorial minimalista, Tailwind, componentes próprios, fontes self-hosted, CSS puro, skeletons                             |
| Identidade     | Nome "Notas do Thiago"; acento `#6366f1`; fundo `#fafafa`; texto `#18181b`; radius `12px`; dark mode com toggle persistido |
| Docker         | Compose no dev (hot reload + bind mount); imagem multi-stage única no prod com `content/` embutido                         |
| Deploy         | VPS com Docker Compose + Caddy (TLS automático) e domínio próprio                                                          |
| Config         | `.env.example` com validação `zod` no boot da API                                                                          |
| Testes         | Vitest + Supertest; ESLint + Prettier; sem E2E neste MVP                                                                   |
| Git/CI         | Repositório Git + GitHub Actions de `lint + test + build`; deploy manual                                                   |
| SEO            | Pré-render no build, meta tags/OG/canonical, `sitemap.xml`, `robots.txt`, `feed.xml`                                       |
| Acessibilidade | HTML semântico, skip link, foco visível, contraste AA, `prefers-reduced-motion`                                            |
| Documento      | 6 fases com critérios de aceite; licença MIT; README completo                                                              |

---

## 2. Arquitetura

```
Navegador ──▶ Caddy (TLS) ──▶ Express (porta 3000)
                                 ├─ /api/*  → índice em memória (Markdown)
                                 ├─ HTML pré-renderizado (dist/prerender)
                                 └─ /assets/* (build do Vite)

Dev: docker compose → api (watch) + web (Vite, proxy /api) + volume de content/
Prod: imagem única multi-stage → app + Caddy no mesmo compose
```

### Árvore de arquivos alvo

```
.
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts          # bootstrap do Express
│   │   │   ├── app.ts            # middlewares e rotas
│   │   │   ├── config.ts         # env validada com zod
│   │   │   ├── content/
│   │   │   │   ├── loader.ts     # leitura dos .md no boot
│   │   │   │   ├── index.ts      # Map por slug/tag/data
│   │   │   │   └── watcher.ts    # chokidar só em dev
│   │   │   ├── routes/
│   │   │   │   ├── posts.ts
│   │   │   │   ├── tags.ts
│   │   │   │   ├── search.ts
│   │   │   │   └── health.ts
│   │   │   └── static.ts         # entrega prerender + fallback SPA
│   │   └── test/api.test.ts
│   └── web/
│       ├── index.html
│       ├── vite.config.ts        # proxy /api no dev
│       ├── tailwind.config.ts
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── routes/
│       │   ├── components/
│       │   │   ├── Layout.tsx
│       │   │   ├── Header.tsx
│       │   │   ├── ThemeToggle.tsx
│       │   │   ├── PostCard.tsx
│       │   │   ├── TagBadge.tsx
│       │   │   ├── Pagination.tsx
│       │   │   ├── SearchBox.tsx
│       │   │   ├── MarkdownView.tsx
│       │   │   ├── CodeBlock.tsx
│       │   │   ├── Footer.tsx
│       │   │   ├── Skeletons.tsx
│       │   │   └── ErrorBoundary.tsx
│       │   ├── hooks/useTheme.ts
│       │   ├── lib/search.ts     # Fuse.js
│       │   ├── lib/api.ts
│       │   └── styles/globals.css
│       └── public/favicon.svg
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── frontmatter.ts    # schema zod
│       │   ├── parser.ts
│       │   ├── types.ts
│       │   └── slugify.ts
│       └── package.json
├── content/                      # 3 posts de exemplo em pt-BR
├── scripts/
│   ├── prerender.ts              # react-dom/server → dist/prerender
│   ├── feed.ts                   # RSS + sitemap + robots
│   └── og-image.ts               # sharp → 1200x630
├── GLOSSARY.md
├── docs/
│   └── adr/
│       ├── 0001-markdown-como-fonte-da-verdade.md
│       ├── 0002-spa-com-pre-render.md
│       └── 0003-conteudo-embutido-na-imagem.md
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml            # dev + prod (perfis)
├── Caddyfile
├── .env.example
├── .gitignore
├── .editorconfig
├── eslint.config.js
├── .prettierrc
├── tsconfig.base.json
├── package.json
├── README.md
└── LICENSE                       # MIT
```

---

## 3. Fases

### Fase 1 — Fundação

1. Inicializar Git, `.gitignore`, `.editorconfig`, `LICENSE` (MIT).
2. `package.json` raiz com workspaces `apps/*` e `packages/*`; scripts `dev`, `build`, `test`, `lint`, `format`.
3. `tsconfig.base.json` com `strict: true`, paths para `@blog/shared`.
4. ESLint + Prettier na raiz, aplicáveis a todos os workspaces.
5. `.env.example` com `PORT=3000`, `NODE_ENV`, `SITE_URL`, `SITE_TITLE=Notas do Thiago`, `SITE_DESCRIPTION`, `DOMAIN`.
6. `packages/shared`: schema zod do frontmatter (`title`, `date` ISO, `tags`, `summary`, `slug`, `image?`), tipos e `slugify`.

**Critérios de aceite**

- `npm install && npm run lint && npm run test && npm run build` executam do zero.
- `SITE_TITLE` ausente ou inválido gera erro claro na validação zod.

---

### Fase 2 — API e conteúdo

1. Criar `content/` com 3 posts de exemplo (pt-BR, datas ISO, trechos de código, um com imagem local).
2. `packages/shared/src/parser.ts`: lê frontmatter, valida com zod, extrai texto limpo para o índice de busca e calcula tempo de leitura.
3. `apps/api/src/content/loader.ts`: carrega todos os `.md` no boot e monta índice em `Map` (slug, tag, data desc).
4. `watcher.ts`: `chokidar` observando `content/` apenas quando `NODE_ENV=development`.
5. Rotas:
   - `GET /api/posts?page=1&tag=node` → `{ posts, page, totalPages, total }` (10 por página);
   - `GET /api/posts/:slug` → post completo ou 404 JSON;
   - `GET /api/tags` → `[{ tag, count }]`;
   - `GET /api/search` → índice compacto (`slug`, `title`, `summary`, `tags`, `text`);
   - `GET /health` → `{ status: "ok" }`.
6. Tratamento de erros centralizado (JSON), CORS liberado apenas no dev.

**Critérios de aceite**

- Supertest cobre: listagem, paginação, filtro por tag, detalhe, busca, tags, 404 e health.
- Editar um `.md` em dev atualiza o índice sem reiniciar o processo.
- Em produção, nenhum watcher é iniciado.

---

### Fase 3 — Frontend

1. Vite + React + TypeScript + Tailwind; `vite.config.ts` com proxy `/api` → `http://localhost:3000`.
2. `@fontsource` para as fontes (serifada em títulos, sans no corpo), sem chamadas externas em runtime.
3. Rotas: `/`, `/page/:n`, `/posts/:slug`, `/tags`, `/tag/:tag`, `/sobre`, `* → 404`.
4. Componentes conforme árvore; `Layout` com `Header`/`Footer`, `PostCard`, `TagBadge`, `Pagination`, `MarkdownView`, `CodeBlock`.
5. Markdown renderizado com `react-markdown` + `remark-gfm` + `rehype-highlight` + `rehype-sanitize`.
6. Busca com `Fuse.js`: index fetched uma vez em `/api/search`, filtro local a cada tecla, sem request por tecla.
7. `useTheme`: classe `dark` no `<html>`, default por `prefers-color-scheme`, toggle persistido em `localStorage`.
8. Tokens Tailwind: acento `#6366f1`, fundo `#fafafa`, texto `#18181b`, radius `12px`.
9. Acessibilidade desde o início: skip link, foco visível, contraste AA, `aria-*` em toggle/busca, `prefers-reduced-motion`.
10. Skeleton de carregamento e `ErrorBoundary`.

**Critérios de aceite**

- Layout responsivo em mobile/tablet/desktop com os 3 posts de exemplo.
- Navegação completa por teclado; contraste AA verificado.
- Dark mode alterna e persiste após reload.

---

### Fase 4 — Build e SEO

1. `scripts/prerender.ts`: usa `react-dom/server` com o mesmo parser do `packages/shared` para gerar `dist/prerender/` para `/`, `/page/:n`, `/posts/:slug`, `/tag/:tag`, `/sobre`.
2. Cada HTML com `<title>`, meta description, canonical, Open Graph e link para a OG image.
3. `scripts/feed.ts`: gera `feed.xml` (RSS), `sitemap.xml` (todas as URLs) e `robots.txt` apontando para o sitemap.
4. `scripts/og-image.ts`: gera `og-image.png` 1200x630 com `sharp`; `favicon.svg` em `public/`.
5. `apps/api/src/static.ts`: para rotas conhecidas, entregar o HTML pré-renderizado correspondente; fallback para `index.html`; assets com cache longo.
6. Integrar os scripts ao `npm run build` da raiz.

**Critérios de aceite**

- `curl -H 'User-Agent: Googlebot' http://localhost:3000/posts/<slug>` retorna HTML com `<h1>` e meta description já no corpo.
- `sitemap.xml` contém posts, páginas e tags; `feed.xml` é RSS válido.
- Rotas deep-linkadas funcionam com recarga direta no Express.

---

### Fase 5 — Docker e deploy

1. `Dockerfile` multi-stage: `deps` → `build` (front + prerender) → `runtime` (`node:alpine`, apenas produção). Copiar `content/` para dentro da imagem.
2. `docker-compose.yml` com perfis:
   - **dev**: serviço `api` (watch/chokidar, bind mount de `content/`) e `web` (Vite, porta 5173, proxy `/api`);
   - **prod**: serviço `app` (imagem única, porta 3000) + `caddy`.
3. `Caddyfile`: domínio vindo de `DOMAIN`, `reverse_proxy app:3000`, HTTPS automático via Let's Encrypt.
4. Healthcheck no `app` apontando `/health`, `restart: unless-stopped`, volumes do Caddy para certificados.
5. `.dockerignore` para excluir `node_modules`, `dist`, `.git`.

**Critérios de aceite**

- `docker compose --profile dev up --build` sobe API e Vite com hot reload.
- `docker compose --profile prod up -d --build` responde HTTPS no domínio e `/health` saudável.
- Publicar um post = rebuild da imagem (conteúdo embutido); documentado no README.

---

### Fase 6 — Acabamento e documentação

1. Revisar os 3 posts de exemplo (formatação, imagens, metadados).
2. README: visão geral, setup com Docker e sem Docker, estrutura de pastas, "como publicar um post", comandos de teste/build, deploy manual (`docker compose pull && up -d`) e variáveis de ambiente.
3. `.github/workflows/ci.yml`: `lint + test + build` em push/PR; sem deploy automático.
4. Verificação final de acessibilidade, dark mode, favicon, OG image, 404 e estados de erro.
5. Manter `GLOSSARY.md` e os ADRs alinhados com o modelo conforme as fases avançam.

**Critérios de aceite**

- CI verde em um repositório recém-criado.
- Seguindo apenas o README, outra pessoa consegue rodar o projeto e publicar um post.

---

## 4. Riscos e observações

- **SEO em SPA**: mitigado pelo pré-render no build; se o conteúdo passar a ser editado em runtime, será preciso reavaliar (SSG/SSR).
- **Conteúdo embutido na imagem**: virar pública exige rebuild/redeploy — escolha deliberada para manter o deploy simples e imutável.
- **Busca client-side**: adequada para o volume atual de posts; se o índice crescer muito, mover para MiniSearch/Meilisearch no servidor.
- **Node LTS**: fixar a versão no `Dockerfile` e no CI para evitar divergência entre dev e prod.

---

## 5. Status de entrega

Snapshot em 2026-11-24; as seções anteriores permanecem como o plano histórico aprovado.

- **Entregue**: Fases 1 a 5 implementadas (API e Índice de conteúdo em memória, SPA com HTML pré-renderizado, build/SEO, Docker dev/prod e Caddy) e verificadas localmente. `LICENSE`, `docs/PRODUCAO.md` (runbook), `docs/ARQUITETURA.md`, `docs/API.md`, CI com `lint + test + content:check + format:check + build` e este documento de status estão no checkout canônico. `npm run lint`, `npm test`, `npm run build`, `npm run content:check` e `npm run format:check` passam localmente.
- **Versionamento**: o repositório `https://github.com/bythiago/blog` está vinculado ao workspace Multica; o commit inicial e o push para `main` versionam código e Fontes, e o CI passa a executar automaticamente no GitHub. Não há Publicação de Posts nem deploy automático nesta entrega.
- **Pendência operacional**: os comandos de VPS do runbook não foram executados. Com `content/` embutida na imagem (ADR 0003), Publicar qualquer alteração exige rebuild e subida de nova imagem.
