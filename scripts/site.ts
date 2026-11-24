import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseEnv, parsePost, type ParsedPost } from '@blog/shared';

/** Mesmo tamanho de página usado pela API (Fase 2). */
export const POSTS_PER_PAGE = 10;

export interface SiteConfig {
  baseUrl: string;
  title: string;
  description: string;
}

export interface PostSummary {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  readingTime: number;
  image?: string;
}

export interface PostData extends PostSummary {
  body: string;
}

export interface PostsPageData {
  posts: PostSummary[];
  page: number;
  totalPages: number;
  total: number;
}

export interface SiteRoute {
  /** Caminho público, começando com `/` e sem barra final. */
  path: string;
  /** Arquivo relativo dentro de `dist/prerender/`. */
  file: string;
  title: string;
  description: string;
  type: 'website' | 'article';
  lastmod?: string;
  post?: PostData;
  page?: number;
  tag?: string;
}

/** Configuração validada com o mesmo schema zod usado no boot da API. */
export function loadSiteConfig(): SiteConfig {
  const env = parseEnv({
    PORT: process.env.PORT ?? '3000',
    NODE_ENV: process.env.NODE_ENV ?? 'production',
    SITE_URL: process.env.SITE_URL ?? 'http://localhost:3000',
    SITE_TITLE: process.env.SITE_TITLE ?? 'Notas do Thiago',
    SITE_DESCRIPTION:
      process.env.SITE_DESCRIPTION ??
      'Notas técnicas sobre desenvolvimento de software, escritas por Thiago.',
    DOMAIN: process.env.DOMAIN ?? 'localhost',
  });

  return {
    baseUrl: env.SITE_URL.replace(/\/+$/, ''),
    title: env.SITE_TITLE,
    description: env.SITE_DESCRIPTION,
  };
}

export function resolveContentDir(): string {
  const candidates = [
    process.env.CONTENT_DIR,
    resolve(process.cwd(), 'content'),
    resolve(process.cwd(), '..', '..', 'content'),
  ].filter((value): value is string => Boolean(value));

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error(`Diretório de conteúdo não encontrado: ${candidates.join(', ')}`);
  return found;
}

/** Lê as Fontes Markdown com o parser compartilhado, na mesma ordem da API. */
export async function loadPosts(): Promise<ParsedPost[]> {
  const dir = resolveContentDir();
  const files = (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => join(dir, entry.name));

  const posts = await Promise.all(
    files.map(async (file) => {
      try {
        return parsePost(await readFile(file, 'utf8'));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Falha ao carregar ${file}: ${message}`);
      }
    }),
  );

  return posts.sort(
    (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug, 'pt-BR'),
  );
}

export function toSummary(post: ParsedPost): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    summary: post.summary,
    readingTime: post.readingTime,
    ...(post.image ? { image: post.image } : {}),
  };
}

function toPostData(post: ParsedPost): PostData {
  return { ...toSummary(post), body: post.body };
}

export function listPosts(posts: ParsedPost[], page: number, tag?: string): PostsPageData {
  const source = tag ? posts.filter((post) => post.tags.includes(tag)) : posts;
  const total = source.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / POSTS_PER_PAGE);
  const start = (page - 1) * POSTS_PER_PAGE;

  return {
    posts: source.slice(start, start + POSTS_PER_PAGE).map(toSummary),
    page,
    totalPages,
    total,
  };
}

export function collectTags(posts: ParsedPost[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'pt-BR'));
}

/** Todas as páginas indexáveis:Posts, listagens, tags e páginas estáticas. */
export function buildRoutes(config: SiteConfig, posts: ParsedPost[]): SiteRoute[] {
  const routes: SiteRoute[] = [
    {
      path: '/',
      file: 'index.html',
      title: config.title,
      description: config.description,
      type: 'website',
    },
    {
      path: '/sobre',
      file: 'sobre.html',
      title: `Sobre · ${config.title}`,
      description: `Conheça o ${config.title} e o motivo das anotações publicadas aqui.`,
      type: 'website',
    },
    {
      path: '/tags',
      file: 'tags.html',
      title: `Tags · ${config.title}`,
      description: `Todos os assuntos dos Posts do ${config.title}.`,
      type: 'website',
    },
  ];

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  for (let page = 2; page <= totalPages; page += 1) {
    routes.push({
      path: `/page/${page}`,
      file: `page/${page}.html`,
      title: `Página ${page} · ${config.title}`,
      description: `Página ${page} de ${totalPages} de Posts do ${config.title}.`,
      type: 'website',
      page,
    });
  }

  for (const post of posts) {
    const path = `/posts/${encodeURIComponent(post.slug)}`;
    routes.push({
      path,
      file: `posts/${post.slug}.html`,
      title: `${post.title} · ${config.title}`,
      description: post.summary,
      type: 'article',
      lastmod: post.date,
      post: toPostData(post),
    });
  }

  for (const { tag } of collectTags(posts)) {
    const encoded = encodeURIComponent(tag);
    const tagPages = Math.ceil(
      posts.filter((post) => post.tags.includes(tag)).length / POSTS_PER_PAGE,
    );
    for (let page = 1; page <= tagPages; page += 1) {
      const path = page === 1 ? `/tag/${encoded}` : `/tag/${encoded}/page/${page}`;
      routes.push({
        path,
        file: page === 1 ? `tag/${encoded}.html` : `tag/${encoded}/page/${page}.html`,
        title:
          page === 1
            ? `Tag: ${tag} · ${config.title}`
            : `Tag: ${tag} — página ${page} · ${config.title}`,
        description: `Posts com a tag ${tag} no ${config.title}.`,
        type: 'website',
        page,
        tag,
      });
    }
  }

  return routes;
}

/** Dados injetados nos hooks da SPA para o HTML conter o conteúdo real. */
export function dataForRoute(route: SiteRoute, posts: ParsedPost[]) {
  if (route.post) return { post: route.post };
  if (route.tag) {
    const key = `tag:${route.tag}:${route.page ?? 1}`;
    return { pages: { [key]: listPosts(posts, route.page ?? 1, route.tag) } };
  }
  if (route.page && route.page > 1) {
    return { pages: { [String(route.page)]: listPosts(posts, route.page) } };
  }
  return {
    pages: { '1': listPosts(posts, 1) },
    tags: collectTags(posts),
  };
}

/** Escapa caracteres reservados em HTML e XML. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
