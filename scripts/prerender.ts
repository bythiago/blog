import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { renderAppMarkup } from '../apps/web/src/prerender';
import { buildRoutes, dataForRoute, escapeXml, loadPosts, loadSiteConfig } from './site';

const OUTPUT_DIR = resolve(process.cwd(), 'dist', 'prerender');
const TEMPLATE = resolve(process.cwd(), 'apps', 'web', 'dist', 'index.html');

function headTags(
  siteName: string,
  title: string,
  description: string,
  type: 'website' | 'article',
  url: string,
  image: string,
): string {
  return [
    `<meta name="description" content="${escapeXml(description)}" />`,
    `<link rel="canonical" href="${escapeXml(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${escapeXml(siteName)}" />`,
    `<meta property="og:title" content="${escapeXml(title)}" />`,
    `<meta property="og:description" content="${escapeXml(description)}" />`,
    `<meta property="og:url" content="${escapeXml(url)}" />`,
    `<meta property="og:image" content="${escapeXml(image)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:locale" content="pt_BR" />',
    '<meta name="twitter:card" content="summary_large_image" />',
  ]
    .map((tag) => `    ${tag}`)
    .join('\n');
}

function buildHtml(
  siteName: string,
  template: string,
  title: string,
  description: string,
  type: 'website' | 'article',
  url: string,
  image: string,
  body: string,
): string {
  const meta = headTags(siteName, title, description, type, url, image);
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeXml(title)}</title>`)
    .replace(/<meta\b[^>]*name="description"[^>]*\/>/i, '')
    .replace('</head>', `${meta}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  if (html.includes('<div id="root"></div>') || !html.includes(meta)) {
    throw new Error('Template do Vite não contém os marcadores esperados para pré-render.');
  }
  return html;
}

async function main(): Promise<void> {
  const config = loadSiteConfig();
  const posts = await loadPosts();
  const template = await readFile(TEMPLATE, 'utf8');
  const routes = buildRoutes(config, posts);
  const image = `${config.baseUrl}/og-image.png`;

  for (const route of routes) {
    const markup = renderAppMarkup(route.path, dataForRoute(route, posts));
    const html = buildHtml(
      config.title,
      template,
      route.title,
      route.description,
      route.type,
      `${config.baseUrl}${route.path}`,
      image,
      markup,
    );
    const output = join(OUTPUT_DIR, route.file);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, html, 'utf8');
  }

  console.log(`Pré-render concluído: ${routes.length} páginas em ${OUTPUT_DIR}`);
}

void main().catch((error: unknown) => {
  console.error('Falha no pré-render:', error);
  process.exitCode = 1;
});
