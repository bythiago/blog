# Referência da API

A API Express serve `/health`, `/api/*` e os artefatos do build na mesma porta (`PORT`, padrão `3000`; em produção, publicada como `API_PORT`). Todas as respostas desta referência são `application/json; charset=utf-8`, com exceção dos arquivos estáticos. Os exemplos usam `BASE=http://localhost:3000`. Os formatos abaixo foram conferidos no código de `apps/api/src/routes/`, `apps/api/src/app.ts` e `apps/api/src/content/index.ts`.

## `GET /health`

Healthcheck do processo; não depende do índice de conteúdo.

```bash
curl -fsS "$BASE/health"
```

```json
{ "status": "ok" }
```

## `GET /api/posts?page=&tag=`

Lista uma Página do Índice de conteúdo. Os Posts vêm ordenados por `date` decrescente e, em empate, por `slug` em `pt-BR`. Cada Página tem no máximo **10** Posts (`POSTS_PER_PAGE` em `apps/api/src/content/index.ts`).

| Parâmetro | Tipo             | Padrão | Regra                                                    |
| --------- | ---------------- | ------ | -------------------------------------------------------- |
| `page`    | inteiro positivo | `1`    | Inválido (`0`, negativo, texto, decimal) responde 400    |
| `tag`     | texto (uma Tag)  | —      | Repetir a chave ou passar valor não textual responde 400 |

Resposta:

```json
{
  "posts": [
    {
      "slug": "builds-reproduziveis-sem-misterio",
      "title": "Builds reproduzíveis sem mistério",
      "date": "2026-11-23",
      "tags": ["frontend"],
      "summary": "Notas sobre Builds reproduzíveis sem mistério, com um exemplo pequeno e os pontos que merecem atenção antes de seguir em frente.",
      "readingTime": 1
    }
  ],
  "page": 1,
  "totalPages": 2,
  "total": 12
}
```

Exemplo abreviado: a primeira entrada de `posts` está mostrada; a resposta real traz 10 resumos nesta Página.

- `posts`: resumos (`slug`, `title`, `date`, `tags`, `summary`, `readingTime` e `image` quando a Fonte define uma imagem). Não inclui `body` nem `text`.
- `total`: quantidade de Posts no recorte (todos ou os da Tag); `totalPages`: `ceil(total / 10)`, ou `0` quando não há Posts.
- `page` fora da faixa devolve `posts: []` com os mesmos `total`/`totalPages`; uma Tag sem Posts devolve `{ "posts": [], "page": 1, "totalPages": 0, "total": 0 }`.

```bash
# Primeira Página
curl -fsS "$BASE/api/posts"

# Segunda Página, filtrada por Tag
curl -fsS "$BASE/api/posts?page=2&tag=node"
```

## `GET /api/posts/:slug`

Devolve o Post completo (`slug`, `title`, `date`, `tags`, `summary`, `image?`, `body`, `text`, `readingTime`), onde `body` é o Corpo em Markdown e `text` é o texto limpo usado no Índice de busca.

```bash
curl -fsS "$BASE/api/posts/primeiros-passos-com-node"
```

```json
{
  "slug": "primeiros-passos-com-node",
  "title": "Primeiros passos com Node.js",
  "date": "2026-01-15",
  "tags": ["node", "typescript"],
  "summary": "Como estruturar um pequeno serviço HTTP em Node.js com TypeScript e manter o código previsível.",
  "body": "# Primeiros passos com Node.js\n…",
  "text": "Primeiros passos com Node.js …",
  "readingTime": 1
}
```

O campo `image` aparece apenas quando a Fonte o declara (por exemplo, no Post `markdown-com-imagens-locais`). Um slug desconhecido responde 404:

```json
{ "error": "Post não encontrado: nao-existe" }
```

## `GET /api/tags`

Conta as Tags do Índice de conteúdo, ordenadas por `count` decrescente e, em empate, por `tag` em `pt-BR`.

```bash
curl -fsS "$BASE/api/tags"
```

```json
[
  { "tag": "typescript", "count": 6 },
  { "tag": "testes", "count": 4 },
  { "tag": "docker", "count": 3 }
]
```

Exemplo abreviado: atualmente existem 8 Tags; as demais seguem a mesma ordem.

## `GET /api/search`

Devolve o Índice de busca completo e compacto, sem parâmetros. Cada entrada tem exatamente `slug`, `title`, `summary`, `tags` e `text` (texto do Corpo sem marcações). O frontend busca uma única vez e filtra localmente com Fuse.js; não há request por tecla.

```bash
curl -fsS "$BASE/api/search"
```

```json
[
  {
    "slug": "builds-reproduziveis-sem-misterio",
    "title": "Builds reproduzíveis sem mistério",
    "summary": "…",
    "tags": ["frontend"],
    "text": "Builds reproduzíveis sem mistério …"
  }
]
```

## Erros

Erros da API são sempre JSON com um campo `error`:

| Situação                                   | Status | Corpo                                              |
| ------------------------------------------ | ------ | -------------------------------------------------- |
| `page` inválido em `/api/posts`            | 400    | `{ "error": "page deve ser um inteiro positivo" }` |
| `tag` repetida ou não textual              | 400    | `{ "error": "tag deve ser um texto" }`             |
| JSON malformado no corpo de uma requisição | 400    | `{ "error": "JSON inválido" }`                     |
| Slug de Post inexistente                   | 404    | `{ "error": "Post não encontrado: <slug>" }`       |
| Rota `/api/*` inexistente                  | 404    | `{ "error": "Rota não encontrada: /<caminho>" }`   |
| Falha não tratada                          | 500    | `{ "error": "Erro interno do servidor" }`          |

```bash
curl -s -i "$BASE/api/posts?page=0"      # 400
curl -s -i "$BASE/api/posts/nao-existe"  # 404
curl -s -i "$BASE/api/desconhecida"      # 404
```

Caminhos fora de `/api` e `/health` não são erros da API: o Express entrega o HTML pré-renderizado de `dist/prerender/` quando existe, ou o `index.html` da SPA como fallback (`apps/api/src/static.ts`). O CORS é liberado apenas quando `NODE_ENV=development` (`apps/api/src/app.ts`).
