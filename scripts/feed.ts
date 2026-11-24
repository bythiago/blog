import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  buildRoutes,
  escapeXml,
  loadPosts,
  loadSiteConfig,
  type SiteConfig,
  type SiteRoute,
} from './site';

const OUTPUT_DIR = resolve(process.cwd(), 'dist', 'prerender');

function buildFeed(config: SiteConfig, routes: SiteRoute[]): string {
  const { baseUrl, title, description } = config;
  const items = routes
    .filter((route): route is SiteRoute & { post: NonNullable<SiteRoute['post']> } =>
      Boolean(route.post),
    )
    .map((route) => {
      const post = route.post;
      const categories = post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`);
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(baseUrl + route.path)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(baseUrl + route.path)}</guid>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        ...categories,
        '    </item>',
      ].join('\n');
    });

  const lastBuildDate = new Date().toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(description)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(baseUrl + '/feed.xml')}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`;
}

function buildSitemap(baseUrl: string, routes: SiteRoute[]): string {
  const urls = routes.map((route) => {
    const lines = [`    <url>`, `      <loc>${escapeXml(baseUrl + route.path)}</loc>`];
    if (route.lastmod) lines.push(`      <lastmod>${escapeXml(route.lastmod)}</lastmod>`);
    lines.push('    </url>');
    return lines.join('\n');
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

function buildRobots(baseUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /health

Sitemap: ${baseUrl}/sitemap.xml
`;
}

async function main(): Promise<void> {
  const config = loadSiteConfig();
  const posts = await loadPosts();
  const routes = buildRoutes(config, posts);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    writeFile(join(OUTPUT_DIR, 'feed.xml'), buildFeed(config, routes), 'utf8'),
    writeFile(join(OUTPUT_DIR, 'sitemap.xml'), buildSitemap(config.baseUrl, routes), 'utf8'),
    writeFile(join(OUTPUT_DIR, 'robots.txt'), buildRobots(config.baseUrl), 'utf8'),
  ]);

  console.log(
    `Feed gerado: ${routes.filter((route) => route.post).length} Posts; sitemap com ${routes.length} URLs; robots aponta para /sitemap.xml`,
  );
}

void main().catch((error: unknown) => {
  console.error('Falha ao gerar feed/sitemap/robots:', error);
  process.exitCode = 1;
});
