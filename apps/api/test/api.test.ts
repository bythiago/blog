import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { ContentIndex } from '../src/content';
import { loadContentIntoIndex, loadPosts } from '../src/content/loader';
import { startWatcher } from '../src/content/watcher';

const FIXTURE_DIR = resolve(__dirname, 'fixtures');

async function makeIndex(): Promise<ContentIndex> {
  const index = new ContentIndex();
  index.replace(await loadPosts(FIXTURE_DIR));
  return index;
}

async function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Condição não satisfeita antes do timeout');
}

function sourceWithTitle(title: string): string {
  return `---
title: "${title}"
date: "2026-04-01"
slug: "watched"
tags: ["node"]
summary: "Fonte usada no teste do watcher."
---

# ${title}

Texto da Fonte.
`;
}

describe('API do blog', () => {
  it('GET /health responde status ok', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /api/posts lista Posts ordenados por data com resumo e tempo de leitura', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const response = await request(app).get('/api/posts');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 1, totalPages: 2, total: 12 });
    expect(response.body.posts).toHaveLength(10);
    expect(response.body.posts.slice(0, 3).map((post: { slug: string }) => post.slug)).toEqual([
      'markdown-com-imagens-locais',
      'validando-dados-com-zod',
      'primeiros-passos-com-node',
    ]);
    expect(response.body.posts[0]).toEqual(
      expect.objectContaining({
        slug: 'markdown-com-imagens-locais',
        title: 'Markdown com imagens locais',
        tags: ['markdown'],
        image: '/content/images/capa-markdown.svg',
        readingTime: 1,
      }),
    );
    expect(response.body.posts[0].body).toBeUndefined();
    expect(response.body.posts[0].text).toBeUndefined();
  });

  it('GET /api/posts pagina 12 Fontes em 10 + 2, sem sobreposição e em ordem data desc e slug', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const first = await request(app).get('/api/posts');
    const second = await request(app).get('/api/posts?page=2');

    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ page: 1, totalPages: 2, total: 12 });
    expect(first.body.posts).toHaveLength(10);
    expect(first.body.posts.map((post: { slug: string }) => post.slug)).toEqual([
      'markdown-com-imagens-locais',
      'validando-dados-com-zod',
      'primeiros-passos-com-node',
      'entendendo-closures-em-javascript',
      'promessas-e-async-await',
      'testes-de-integracao-com-supertest',
      'organizando-testes-com-vitest',
      'tipando-respostas-de-api',
      'modulos-esm-em-node',
      'busca-local-com-fuse',
    ]);

    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ page: 2, totalPages: 2, total: 12 });
    expect(second.body.posts).toHaveLength(2);
    // As duas Fontes mais antigas têm a mesma data: a ordem é decidida pelo slug.
    expect(
      second.body.posts.map((post: { slug: string; date: string }) => [post.date, post.slug]),
    ).toEqual([
      ['2025-04-01', 'alpha-ordenacao-por-slug'],
      ['2025-04-01', 'zeta-ordenacao-por-slug'],
    ]);

    const firstSlugs = first.body.posts.map((post: { slug: string }) => post.slug);
    const secondSlugs = second.body.posts.map((post: { slug: string }) => post.slug);
    expect(secondSlugs.filter((slug: string) => firstSlugs.includes(slug))).toEqual([]);
  });

  it('GET /api/posts?page=3 devolve lista vazia mantendo os mesmos totais', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const response = await request(app).get('/api/posts?page=3');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ posts: [], page: 3, totalPages: 2, total: 12 });
  });

  it('rejeita página inválida com erro em JSON', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const response = await request(app).get('/api/posts?page=0');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'page deve ser um inteiro positivo' });
  });

  it('GET /api/posts?tag=... filtra pelo Índice de conteúdo', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const typescript = await request(app).get('/api/posts?tag=typescript');
    const inexistente = await request(app).get('/api/posts?tag=inexistente');

    expect(typescript.status).toBe(200);
    expect(typescript.body.total).toBe(2);
    expect(typescript.body.posts.map((post: { slug: string }) => post.slug)).toEqual([
      'validando-dados-com-zod',
      'primeiros-passos-com-node',
    ]);
    expect(inexistente.body).toEqual({ posts: [], page: 1, totalPages: 0, total: 0 });
  });

  it('GET /api/posts?tag=javascript&page=2 devolve só o excedente da Tag com mais de 10 Fontes', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const first = await request(app).get('/api/posts?tag=javascript');
    const second = await request(app).get('/api/posts?tag=javascript&page=2');

    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ page: 1, totalPages: 2, total: 11 });
    expect(first.body.posts).toHaveLength(10);

    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ page: 2, totalPages: 2, total: 11 });
    expect(second.body.posts).toHaveLength(1);
    expect(second.body.posts[0].slug).toBe('zeta-ordenacao-por-slug');
    expect(second.body.posts[0].tags).toContain('javascript');

    const firstSlugs = first.body.posts.map((post: { slug: string }) => post.slug);
    expect(firstSlugs).not.toContain('zeta-ordenacao-por-slug');
  });

  it('GET /api/posts/:slug devolve o Post completo ou 404 em JSON', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const found = await request(app).get('/api/posts/validando-dados-com-zod');
    const missing = await request(app).get('/api/posts/nao-existe');

    expect(found.status).toBe(200);
    expect(found.body).toEqual(
      expect.objectContaining({
        slug: 'validando-dados-com-zod',
        body: expect.stringContaining('const post = postSchema.parse'),
        text: expect.any(String),
        readingTime: expect.any(Number),
      }),
    );
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Post não encontrado: nao-existe' });
  });

  it('GET /api/search devolve o Índice de busca compacto e limpo', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const response = await request(app).get('/api/search');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(12);
    expect(
      response.body.some((entry: { text: string }) =>
        entry.text.toLowerCase().includes('markdown'),
      ),
    ).toBe(true);
    for (const entry of response.body) {
      expect(Object.keys(entry).sort()).toEqual(['slug', 'summary', 'tags', 'text', 'title']);
      expect(entry.text.length).toBeGreaterThan(20);
      expect(entry.text).not.toContain('```');
      expect(entry.text).not.toMatch(/#\s/);
    }
  });

  it('GET /api/tags agrupa e conta as Tags', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const response = await request(app).get('/api/tags');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        { tag: 'typescript', count: 2 },
        { tag: 'node', count: 1 },
        { tag: 'markdown', count: 1 },
        { tag: 'zod', count: 1 },
      ]),
    );
  });

  it('rotas de API inexistentes e JSON malformado retornam erros em JSON', async () => {
    const app = createApp({ index: await makeIndex(), nodeEnv: 'production' });

    const notFound = await request(app).get('/api/inexistente');
    const badJson = await request(app)
      .post('/api/posts')
      .set('Content-Type', 'application/json')
      .send('{');

    expect(notFound.status).toBe(404);
    expect(notFound.body.error).toMatch(/Rota não encontrada/);
    expect(badJson.status).toBe(400);
    expect(badJson.body).toEqual({ error: 'JSON inválido' });
  });

  it('CORS é liberado apenas em development', async () => {
    const index = await makeIndex();

    const dev = await request(createApp({ index, nodeEnv: 'development' }))
      .get('/health')
      .set('Origin', 'http://localhost:5173');
    const prod = await request(createApp({ index, nodeEnv: 'production' }))
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(dev.headers['access-control-allow-origin']).toBeDefined();
    expect(prod.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('em development o watcher atualiza o índice sem reiniciar o processo', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'blog-content-'));
    const file = join(dir, 'watched.md');
    await writeFile(file, sourceWithTitle('Título antigo'));

    const index = new ContentIndex();
    await loadContentIntoIndex(index, dir);
    expect(index.getBySlug('watched')?.title).toBe('Título antigo');

    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const watcher = startWatcher(index, dir);

    try {
      expect(watcher).not.toBeNull();
      await Promise.race([
        new Promise<void>((resolve) => watcher?.once('ready', resolve)),
        new Promise<void>((resolve) => setTimeout(resolve, 500)),
      ]);

      await writeFile(file, sourceWithTitle('Título novo'));
      await waitFor(() => index.getBySlug('watched')?.title === 'Título novo');

      const app = createApp({ index, nodeEnv: 'development' });
      const response = await request(app).get('/api/posts/watched');
      expect(response.body.title).toBe('Título novo');
    } finally {
      await watcher?.close();
      if (previousEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnv;
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('em produção nenhum watcher é iniciado', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'blog-content-'));
    const index = new ContentIndex();
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      expect(startWatcher(index, dir)).toBeNull();
    } finally {
      if (previousEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnv;
      await rm(dir, { recursive: true, force: true });
    }
  });
});
