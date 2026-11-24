# AGENTS.md — Notas do Thiago

## Checkout

- Checkout canônico: `/home/thiago/Sites/blog`. O workdir de uma task do Multica pode ser temporário: se não houver código nele, use esse caminho e registre isso na issue. Não altere outro checkout.
- Monorepo npm workspaces: `apps/api` (Express), `apps/web` (React + Vite), `packages/shared` (schemas Zod, parser e tipos), `content/` (Fontes dos Posts) e `scripts/` (pré-render, feed/sitemap/robots e imagem OG).

## Vocabulário

Use os termos de `GLOSSARY.md`: **Post**, **Fonte**, **Corpo**, **Resumo**, **Tag**, **Publicação**, **Leitor**, **Página**, **Página de listagem**, **Índice de conteúdo** e **Índice de busca**. Evite "artigo", "usuário", "conteúdo bruto" e "feed".

## Restrições das decisões registradas

- ADR 0001: Markdown versionado é a Fonte. Não crie CMS, banco de dados nem edição de conteúdo em runtime.
- ADR 0002: SPA React com HTML pré-renderizado no build. Não introduza SSR permanente; conteúdo novo exige rebuild.
- ADR 0003: produção embute `content/` na imagem. Publicar exige rebuild/redeploy; apenas o dev usa bind mount.
- Markdown exibido ao Leitor passa por `rehype-sanitize`. Nunca use `dangerouslySetInnerHTML`.
- Busca é local, com Fuse.js sobre um índice único. Não faça request por tecla.

## Ambiente

- Node >= 20. CI e Docker usam Node 24.
- Copie `.env.example` para `.env`. As seis variáveis são validadas por Zod no boot em `packages/shared/src/env.ts`: `PORT`, `NODE_ENV`, `SITE_URL`, `SITE_TITLE`, `SITE_DESCRIPTION`, `DOMAIN`.
- Portas: dev API `3000` (`API_PORT`), web `5173` (`WEB_PORT`); produção app `3000` (`API_PORT`) e Caddy `80`/`443` (`HTTP_PORT`/`HTTPS_PORT`). Se `3000` estiver ocupada, sobrescreva `API_PORT`; não interrompa outro serviço.

## Comandos

```bash
npm ci
npm run lint
npm run test
npm run build
npm run format:check
```

- `npm run dev` na raiz é apenas `tsc -b --watch`. Para desenvolvimento completo, use `npm run dev -w apps/api` e `npm run dev -w apps/web` (proxy `/api` → `http://localhost:3000`), ou `docker compose --profile dev up --build`.
- Produção local: `docker compose --profile prod up -d --build`. Saúde: `curl http://localhost:3000/health`.
- O CI roda `npm ci`, `npm run lint`, `npm run test` e `npm run build` no Node 24. Reproduza isso antes de entregar. Se um comando não existir ou falhar por ambiente, diga qual — não invente comando nem resultado.

## Publicar um Post

1. Crie `content/<slug>.md` com frontmatter válido: `title`, `date`, `slug`, `tags`, `summary` e `image` (opcional).
2. Coloque imagens em `content/images/` e referencie como `/content/images/...`.
3. Rode `npm run lint && npm run test && npm run build`.
4. Registre a alteração em commit/PR. Em produção, gere uma nova imagem.

## Escopo e entrega

- Faça a menor mudança que atende à issue; sem refactor oportunista.
- Não faça commit, push, deploy, Publicação nem mudança de permissões sem confirmação explícita.
- Toda entrega registra comando e saída observável. Código sem verificação não é entrega.
