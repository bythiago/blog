# Runbook de produção

Este runbook descreve como colocar o blog em produção **manualmente**. Não há CD automático. A Publicação segue o vocabulário de `GLOSSARY.md`: Publicar um Post é torná-lo disponível ao Leitor e, com o conteúdo embutido na imagem (ADR 0003), exige rebuild e subida de nova imagem.

Os blocos marcados com `# [VPS]` pressupõem acesso ao servidor com Docker e Docker Compose. Os demais rodam no checkout local. Nenhum deles foi executado contra produção na preparação deste runbook.

## 1. Pré-requisitos

- [VPS] Docker com o plugin Docker Compose.
- [VPS] Domínio público apontando para a VPS, com as portas `80` e `443` livres e liberadas no firewall. Sem um domínio público válido, o Caddy não consegue emitir certificado Let's Encrypt.
- [VPS] Portas do compose (valores padrão entre parênteses):
  - `API_PORT` (`3000`): porta publicada da app Express. Dentro do contêiner a API escuta sempre em `3000` (`PORT`), inclusive no healthcheck; se a porta `3000` do host estiver ocupada, sobrescreva `API_PORT` no `.env` sem interromper outro serviço.
  - `HTTP_PORT` (`80`) e `HTTPS_PORT` (`443`): portas publicadas do Caddy.
- [VPS] Cópia do `.env` a partir do modelo (o `.env` é ignorado pelo Git):

  ```bash
  # [VPS]
  cp .env.example .env
  ${EDITOR:-nano} .env
  ```

  Exemplo de valores para produção (substitua `example.com` pelo seu domínio; não há segredos nestas seis variáveis):

  ```dotenv
  PORT=3000
  NODE_ENV=production
  SITE_URL=https://example.com
  SITE_TITLE=Notas do Thiago
  SITE_DESCRIPTION=Notas técnicas sobre desenvolvimento de software, escritas por Thiago.
  DOMAIN=example.com
  ```

- As seis variáveis acima são validadas por Zod no boot (`packages/shared/src/env.ts`). `PORT` deve ser inteiro entre 1 e 65535, `NODE_ENV` é `development`, `production` ou `test`, `SITE_URL` deve ser uma URL válida, e `SITE_TITLE`, `SITE_DESCRIPTION` e `DOMAIN` não podem ficar vazios. Valor ausente ou inválido aborta a subida com mensagem de erro.

### Relação entre `SITE_URL`, `DOMAIN` e TLS

- `DOMAIN` é injetado no `Caddyfile` (`{$DOMAIN:localhost}`) por `docker-compose.yml`. Com um domínio público, o Caddy emite e renova o certificado Let's Encrypt automaticamente; com `DOMAIN=localhost`, ele usa a CA interna (certificado autoassinado) apenas para testes locais.
- `SITE_URL` é a URL pública base do site (esquema + host). Ela alimenta as URLs canônicas, do feed, do sitemap e das imagens OG geradas no build, além da validação de ambiente. Use `https://example.com` em produção, com o mesmo host de `DOMAIN` e o esquema `https`.
- `SITE_URL` e `DOMAIN` também são passados como build args (`docker-compose.yml`); por isso o `.env` precisa estar correto **antes** do `up -d --build`.

## 2. Checklist pré-Publicação (local)

Execute na raiz do checkout e exija exit 0 em todos os comandos:

```bash
npm ci
npm run lint
npm test
npm run content:check
npm run format:check
npm run build
```

`content:check` valida as Fontes em `content/`; `build` gera os HTMLs pré-renderizados, `sitemap.xml`, `feed.xml`, `robots.txt` e `og-image.png` em `dist/prerender/`.

## 3. Subida (VPS)

```bash
# [VPS]
cd /caminho/para/blog
docker compose --profile prod up -d --build
```

- `--build` é necessário no fluxo atual: as Fontes e os artefatos do build entram na imagem (ADR 0003).
- `docker compose --profile prod pull` só se aplica se você tiver configurado uma imagem publicada com `image:`; o compose deste projeto constrói a imagem localmente.
- [VPS] Aguarde o contêiner `app` ficar `healthy` antes de seguir (o `caddy` depende disso).

## 4. Smoke test (VPS)

As rotas de API e os artefatos estáticos são servidos pela app na porta publicada por `API_PORT`; o Caddy faz o proxy TLS na porta `443`.

O Docker Compose lê o `.env`, mas o shell não: carregue as variáveis antes de montar a URL (ou informe a porta e o domínio diretamente).

```bash
# [VPS]
set -a; . ./.env; set +a
BASE="http://127.0.0.1:${API_PORT:-3000}"
SLUG=primeiros-passos-com-node   # slug existente em content/

for path in /health /api/posts "/api/posts/$SLUG" /api/tags /api/search /sitemap.xml /feed.xml /sobre; do
  curl -fsS -o /dev/null -w '%{http_code} %{content_type} %{url_effective}\n' "$BASE$path"
done
```

Espere `200` em todas as linhas; `/api/*` deve responder `application/json`, `sitemap.xml` e `feed.xml` como XML, e `/sobre` como HTML. Se alguma falhar, pare e cheque logs (seção 5) antes de repetir.

Confirme que a Página pré-renderizada traz `<title>` e description no HTML entregue:

```bash
# [VPS]
curl -fsS "$BASE/sobre" | grep -o '<title>[^<]*</title>'
curl -fsS "$BASE/sobre" | grep -o '<meta name="description"[^>]*>'
```

Opcionalmente, repita o smoke test pelo domínio público, passando pelo Caddy:

```bash
# [VPS]
curl -fsS -o /dev/null -w '%{http_code} %{url_effective}\n' "https://${DOMAIN}/health"
```

Para `DOMAIN=localhost` em teste local, o certificado é autoassinado: use `curl -k` **apenas nesse teste local**, nunca em produção.

## 5. Healthcheck e logs (VPS)

```bash
# [VPS]
docker compose --profile prod ps
docker compose --profile prod inspect --format '{{json .State.Health}}' app
docker compose --profile prod logs --tail=200 app
docker compose --profile prod logs --tail=200 caddy
```

O healthcheck da app executa `fetch('http://127.0.0.1:3000/health')` a cada 10s (5 retries). O estado do serviço `app` deve aparecer como `healthy`; o `caddy` só sobe depois disso. Nos logs, confira inicialização da API, erros de validação de ambiente e erros do Caddy ao provisionar/renovar certificado.

## 6. Rollback (VPS)

Não existe rollback automático. Mantenha fora do servidor uma cópia da revisão conhecida como boa (`.env`, `docker-compose.yml`, Fontes e código); o repositório `https://github.com/bythiago/blog` está vinculado ao workspace Multica e versiona código e Fontes, mas a cópia da revisão boa no servidor continua sendo responsabilidade de quem opera a VPS.

Para voltar à última revisão boa:

```bash
# [VPS]
docker compose --profile prod stop app caddy
# restaure .env, docker-compose.yml e os arquivos da revisão boa
docker compose --profile prod up -d --build
# repita o healthcheck (seção 5) e o smoke test (seção 4)
```

Se a mudança foi apenas de configuração em `.env`, basta restaurá-lo e recriar os contêineres com `docker compose --profile prod up -d --force-recreate`. **Não** use `docker compose ... down -v`: isso apagaria os volumes `caddy_data` e `caddy_config` com certificados e estado do Caddy.

## 7. Backup e restore dos volumes do Caddy (VPS)

O compose define os volumes nomeados `caddy_data` (certificados e estado) e `caddy_config`. Com `name: notas-do-thiago` no compose, os nomes reais no Docker são `notas-do-thiago_caddy_data` e `notas-do-thiago_caddy_config`; confirme com `docker volume ls | grep notas-do-thiago` se o projeto foi renomeado.

Backup (com o Caddy parado, para cópia consistente):

```bash
# [VPS]
mkdir -p backup
docker compose --profile prod stop caddy
docker run --rm -v notas-do-thiago_caddy_data:/data:ro -v "$PWD/backup:/backup" alpine:3 \
  tar czf /backup/caddy_data.tgz -C /data .
docker run --rm -v notas-do-thiago_caddy_config:/config:ro -v "$PWD/backup:/backup" alpine:3 \
  tar czf /backup/caddy_config.tgz -C /config .
docker compose --profile prod start caddy
```

Restore:

```bash
# [VPS]
docker compose --profile prod stop caddy
docker run --rm -v notas-do-thiago_caddy_data:/data -v "$PWD/backup:/backup" alpine:3 \
  sh -c 'tar xzf /backup/caddy_data.tgz -C /data'
docker run --rm -v notas-do-thiago_caddy_config:/config -v "$PWD/backup:/backup" alpine:3 \
  sh -c 'tar xzf /backup/caddy_config.tgz -C /config'
docker compose --profile prod start caddy
```

Os arquivos de backup contêm chaves privadas dos certificados: armazene-os com permissão restrita e nunca os anexe a issues ou mensagens.

## 8. Publicar novos Posts

Pelo ADR 0003, as Fontes vão embutidas na imagem de produção; apenas o perfil `dev` usa bind mount de `content/`. Publicar exige rebuild/redeploy da imagem:

```bash
# local
npm run lint && npm test && npm run content:check && npm run format:check && npm run build
# [VPS]
docker compose --profile prod up -d --build
```

Depois disso, repita healthcheck, logs e smoke test das seções 4 e 5.

## 9. Limitações registradas

- O repositório `https://github.com/bythiago/blog` está vinculado ao workspace Multica; o código e as Fontes são versionados e enviados ao remoto na branch `main`.
- O workflow `.github/workflows/ci.yml` passa a executar automaticamente no GitHub em `push` e `pull_request` (sem deploy automático).
- Nenhum deploy, Publicação ou criação de Fontes reais em `content/` foi executado: este documento é somente procedimento.
- Publicar qualquer alteração de conteúdo exige rebuild/redeploy (ADR 0003); a imagem de produção não lê `content/` do host.
