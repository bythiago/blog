# Notas do Thiago

Blog pessoal técnico em pt-BR, feito com Node.js, Express e React. O conteúdo é versionado como Markdown no repositório, renderizado como SPA e pré-renderizado no build para SEO.

## Visão geral

- **Monorepo npm workspaces**: `apps/api`, `apps/web`, `packages/shared`.
- **Conteúdo como Fonte da verdade**: Posts em `content/*.md` com frontmatter validado por Zod.
- **API REST**: Express serve `/api/*`, `/health`, assets e HTML pré-renderizado.
- **Frontend**: React + Vite + Tailwind, com dark mode, busca local (Fuse.js) e acessibilidade básica.
- **SEO**: pré-render de rotas, `feed.xml`, `sitemap.xml`, `robots.txt` e `og-image.png`.
- **Deploy**: imagem Docker multi-stage única com `content/` embutido; Caddy faz TLS automático em produção.

## Estrutura de pastas

```text
.
├── apps/
│   ├── api/                  # Express: rotas da API, conteúdo em memória, estáticos
│   └── web/                  # React + Vite + Tailwind
├── packages/
│   └── shared/               # Schemas Zod, parser, tipos e utilitários compartilhados
├── content/                  # Fontes Markdown dos Posts e imagens locais
├── docs/
│   ├── PLANO.md              # Plano do projeto por fases
│   ├── PRODUCAO.md           # Runbook de produção
│   └── adr/                  # ADRs das decisões de arquitetura
├── scripts/                  # pré-render, feed/sitemap/robots, OG image
├── Dockerfile
├── docker-compose.yml        # perfis dev e prod
├── Caddyfile
├── .env.example
├── LICENSE                   # licença MIT
└── GLOSSARY.md               # linguagem ubíqua do domínio
```

## Setup

### Pré-requisitos

- Node.js >= 20 e npm.
- Docker e Docker Compose (opcional, recomendado para paridade com produção).

### Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```bash
cp .env.example .env
```

| Variável           | Descrição                                                    | Exemplo                                                                  |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `PORT`             | Porta da API/servidor Express.                               | `3000`                                                                   |
| `NODE_ENV`         | Ambiente de execução: `development`, `production` ou `test`. | `development`                                                            |
| `SITE_URL`         | URL pública base do site (sem barra final obrigatória).      | `http://localhost:3000`                                                  |
| `SITE_TITLE`       | Título do site.                                              | `Notas do Thiago`                                                        |
| `SITE_DESCRIPTION` | Descrição usada em metadados/SEO.                            | `Notas técnicas sobre desenvolvimento de software, escritas por Thiago.` |
| `DOMAIN`           | Domínio usado pelo Caddy em produção.                        | `localhost`                                                              |

A validação é feita com Zod no boot (`packages/shared/src/env.ts`). Valores ausentes ou inválidos geram erro claro.

### Rodar sem Docker

```bash
npm install
npm run build
npm run test
npm run lint
```

Para desenvolvimento:

```bash
# Terminal 1: API com watch (carrega content/ e observa alterações em dev)
npm run dev -w apps/api

# Terminal 2: Vite com proxy /api -> http://localhost:3000
npm run dev -w apps/web
```

Acesse `http://localhost:5173` no modo dev. A API responde em `http://localhost:3000`.

> Observação: `npm run dev` na raiz executa `tsc -b --watch` (tipos/workspaces). Para a experiência completa de desenvolvimento use os dois comandos de workspace acima.

### Rodar com Docker

Desenvolvimento (hot reload + bind mount de `content/`):

```bash
docker compose --profile dev up --build
```

- Web/Vite: `http://localhost:5173`
- API: `http://localhost:3000`

Produção local (imagem única + Caddy):

```bash
docker compose --profile prod up -d --build
```

- App: `http://localhost:3000` (exposto pelo compose)
- Caddy: `http://localhost` / `https://localhost` conforme `DOMAIN`

Verifique saúde:

```bash
curl http://localhost:3000/health
```

## Como publicar um Post

1. Crie um arquivo `.md` em `content/` com frontmatter válido:

   ```md
   ---
   title: 'Título do Post'
   date: '2026-11-23'
   slug: 'titulo-do-post'
   tags: ['node', 'typescript']
   summary: 'Resumo curto do Post.'
   image: '/content/images/capa.svg' # opcional
   ---

   Corpo do Post em Markdown.
   ```

2. Coloque imagens locais em `content/images/` e referencie como `/content/images/...`.
3. Valide localmente:

   ```bash
   npm run lint && npm run test && npm run build
   ```

4. Faça commit/PR com a Fonte do Post.
5. **Produção**: o conteúdo é embutido na imagem (ADR 0003), então publicar exige rebuild/redeploy da imagem:

   ```bash
   docker compose --profile prod up -d --build
   ```

### Gerar uma Fonte aleatória

O gerador cria Fontes em pt-BR com frontmatter válido, Corpo com seções e bloco de código. A aleatoriedade vem de uma seed inteira: com a mesma seed (e a mesma data), a saída é idêntica. Sem `--date`, o frontmatter usa a data atual em UTC (`YYYY-MM-DD`).

```bash
npm run post:random -- --seed 42 --count 2 --date 2026-11-23 --out content/
```

| Flag                | Descrição                                                          | Padrão              |
| ------------------- | ------------------------------------------------------------------ | ------------------- |
| `--count <n>`       | Quantidade de Fontes a gerar.                                      | `1`                 |
| `--seed <n>`        | Seed inteira; sem ela, a seed é o timestamp atual (não repetível). | timestamp atual     |
| `--date YYYY-MM-DD` | Data usada no frontmatter.                                         | data atual em UTC   |
| `--tag <tag>`       | Tag obrigatória; repita a flag para pedir várias.                  | nenhuma (sorteadas) |
| `--prefix <texto>`  | Prefixo do título; é sanitizado via `slugify` e inicia o slug.     | nenhum              |
| `--out <dir>`       | Diretório onde as Fontes são gravadas.                             | `content/`          |
| `--dry-run`         | Lista caminhos, slugs e Tags sem gravar arquivos.                  | desligado           |
| `--help`            | Mostra a ajuda da CLI.                                             | —                   |

Tags válidas: `node`, `typescript`, `markdown`, `testes`, `docker`, `frontend`, `performance`. Uma Tag inválida encerra a CLI com erro. As Tags pedidas sempre aparecem na Fonte; as demais continuam sendo sorteadas desse conjunto.

```bash
npm run post:random -- --seed 45 --count 3 --tag testes --prefix "Notas:" --dry-run
```

Para conferir sem gravar nada:

```bash
npm run post:random -- --seed 42 --count 2 --dry-run
```

O gerador nunca sobrescreve um `.md` existente: se o slug já estiver em uso, ele re-sorteia a Fonte e avisa; se não conseguir um slug único, descarta a Fonte e avisa. O campo `image` fica ausente por padrão para não referenciar arquivo inexistente.

> Atenção: gerar a Fonte **não publica** o Post. Pelo ADR 0003 o conteúdo vai embutido na imagem de produção — é preciso commit/PR da Fonte e rebuild/redeploy (`docker compose --profile prod up -d --build`) para publicar.

## Comandos de teste/build

Na raiz do monorepo:

| Comando                 | O que faz                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run lint`          | ESLint em todos os workspaces.                                                                    |
| `npm run test`          | Vitest em modo run (shared, api, web).                                                            |
| `npm run content:check` | Valida as Fontes em `content/`: frontmatter, slugs duplicados, nomes de arquivo e imagens.        |
| `npm run build`         | Build completo: tipos (`tsc -b`), web (`vite build`), OG image, pré-render e feed/sitemap/robots. |
| `npm run post:random`   | Gera Fontes Markdown a partir de uma seed (`npm run post:random -- --help`).                      |
| `npm run build:types`   | Apenas build TypeScript dos workspaces referenciados.                                             |
| `npm run build:web`     | Apenas build do frontend.                                                                         |
| `npm run format`        | Formata com Prettier.                                                                             |
| `npm run format:check`  | Verifica formatação.                                                                              |

## Deploy manual

O deploy é manual (sem CD automático). O runbook completo está em [`docs/PRODUCAO.md`](docs/PRODUCAO.md): pré-requisitos e portas, as seis variáveis validadas por Zod, checklist pré-deploy, subida, smoke test com `curl`, healthcheck e logs, rollback e backup/restore de `caddy_data`/`caddy_config`.

Em uma VPS (comandos marcados como VPS no runbook) com Docker Compose e domínio público configurado:

```bash
cp .env.example .env # ajustar SITE_URL, DOMAIN etc. antes do build
docker compose --profile prod up -d --build
```

`--build` é necessário porque as Fontes vão embutidas na imagem (ADR 0003): Publicar exige rebuild/redeploy. O `Caddyfile` usa `{$DOMAIN}` e provisiona TLS automático via Let's Encrypt quando `DOMAIN` é um domínio público válido; `SITE_URL` deve ser a URL pública base coerente com esse domínio.

## CI

O workflow `.github/workflows/ci.yml` executa `lint + test + content:check + format:check + build` em `push` e `pull_request`. Não há deploy automático.

> O repositório `https://github.com/bythiago/blog` está vinculado ao workspace Multica. Com o código versionado e enviado ao remoto, o workflow acima passa a executar automaticamente no GitHub em `push` e `pull_request` (sem deploy). A validação local dos comandos foi registrada na issue PLUT-16.

## Documentação de domínio

- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md): fluxo da Fonte até a imagem de produção, diferenças entre dev e prod e limites deliberados.
- [`docs/API.md`](docs/API.md): endpoints, formatos de resposta, paginação, erros e exemplos de `curl`.
- [`docs/PRODUCAO.md`](docs/PRODUCAO.md): runbook de produção (pré-requisitos, smoke test, healthcheck, logs, rollback e backup).
- [`GLOSSARY.md`](GLOSSARY.md): linguagem ubíqua (Post, Fonte, Corpo, Página de listagem etc.).
- [`docs/adr/`](docs/adr/): decisões arquiteturais (Markdown como fonte, SPA com pré-render, conteúdo embutido na imagem).
- [`docs/PLANO.md`](docs/PLANO.md): plano por fases e critérios de aceite.

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE) na raiz do projeto.
