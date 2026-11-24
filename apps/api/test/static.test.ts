import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { ContentIndex } from '../src/content';

describe('entrega de estáticos e HTML pré-renderizado', () => {
  let root: string;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'blog-static-'));
    await mkdir(join(root, 'prerender', 'posts'), { recursive: true });
    await mkdir(join(root, 'web', 'assets'), { recursive: true });

    await writeFile(join(root, 'prerender', 'index.html'), '<h1>Início</h1>');
    await writeFile(
      join(root, 'prerender', 'posts', 'um-post.html'),
      '<h1>Um post</h1><meta name="description" content="Resumo do post" />',
    );
    await writeFile(join(root, 'prerender', 'sitemap.xml'), '<urlset />');
    await writeFile(join(root, 'web', 'index.html'), '<div id="root"></div>');
    await writeFile(join(root, 'web', 'assets', 'app.js'), 'console.log(1);');

    const index = new ContentIndex();
    index.replace([]);
    app = createApp({
      index,
      nodeEnv: 'production',
      staticDirs: {
        webDistDir: join(root, 'web'),
        prerenderDir: join(root, 'prerender'),
        contentDir: join(root, 'content'),
      },
    });
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('entrega o HTML da rota com conteúdo no corpo', async () => {
    const response = await request(app).get('/posts/um-post').set('User-Agent', 'Googlebot');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('<h1>Um post</h1>');
    expect(response.text).toContain('Resumo do post');
  });

  it('usa index.html da SPA como fallback para rotas sem HTML pré-renderizado', async () => {
    const response = await request(app).get('/rota-desconhecida');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<div id="root"></div>');
  });

  it('serve artefatos de SEO e assets com cache longo', async () => {
    const sitemap = await request(app).get('/sitemap.xml');
    expect(sitemap.text).toContain('<urlset />');

    const asset = await request(app).get('/assets/app.js');
    expect(asset.status).toBe(200);
    expect(asset.headers['cache-control']).toContain('max-age=31536000');
  });

  it('não intercepta as rotas da API', async () => {
    const response = await request(app).get('/api/posts');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ posts: [], page: 1, totalPages: 0, total: 0 });
  });
});
