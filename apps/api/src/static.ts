import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { resolveContentDir } from './content/loader.js';

export interface StaticDirs {
  /** Diretório com `index.html` e `assets/` do Vite. */
  webDistDir?: string;
  /** Diretório com o HTML pré-renderizado e os artefatos de SEO. */
  prerenderDir?: string;
  /** Diretório de Fontes Markdown (para imagens locais dos Posts). */
  contentDir?: string;
}

function firstExisting(candidates: Array<string | undefined>): string | undefined {
  return candidates.find(
    (candidate): candidate is string =>
      typeof candidate === 'string' && candidate.length > 0 && existsSync(candidate),
  );
}

export function resolveWebDistDir(): string {
  return (
    firstExisting([
      process.env.WEB_DIST_DIR,
      resolve(process.cwd(), 'apps', 'web', 'dist'),
      resolve(process.cwd(), '..', 'web', 'dist'),
    ]) ?? resolve(process.cwd(), 'apps', 'web', 'dist')
  );
}

export function resolvePrerenderDir(): string {
  return (
    firstExisting([
      process.env.PRERENDER_DIR,
      resolve(process.cwd(), 'dist', 'prerender'),
      resolve(process.cwd(), '..', '..', 'dist', 'prerender'),
    ]) ?? resolve(process.cwd(), 'dist', 'prerender')
  );
}

function resolveExistingContentDir(): string | undefined {
  try {
    return resolveContentDir();
  } catch {
    return undefined;
  }
}

/**
 * Entrega os artefatos do build: assets com cache longo, HTML pré-renderizado
 * por rota e, na ausência deste, o `index.html` da SPA.
 */
export function mountStatic(app: Express, dirs: StaticDirs = {}): void {
  const webDist = dirs.webDistDir ?? resolveWebDistDir();
  const prerender = dirs.prerenderDir ?? resolvePrerenderDir();
  const content = dirs.contentDir ?? resolveExistingContentDir();

  const assetsDir = join(webDist, 'assets');
  if (existsSync(assetsDir)) {
    app.use(
      '/assets',
      express.static(assetsDir, {
        maxAge: '1y',
        immutable: true,
        index: false,
        fallthrough: true,
      }),
    );
  }

  const imagesDir = content ? join(content, 'images') : undefined;
  if (imagesDir && existsSync(imagesDir)) {
    app.use(
      '/content/images',
      express.static(imagesDir, { maxAge: '1h', index: false, fallthrough: true }),
    );
  }

  if (existsSync(prerender)) {
    app.use(
      express.static(prerender, {
        maxAge: '1h',
        index: false,
        fallthrough: true,
        redirect: false,
      }),
    );
  }

  if (existsSync(webDist)) {
    app.use(
      express.static(webDist, {
        maxAge: '1h',
        index: false,
        fallthrough: true,
        redirect: false,
      }),
    );
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    let pathname: string;
    try {
      pathname = decodeURIComponent(req.path);
    } catch {
      next();
      return;
    }

    if (!req.accepts('html') || pathname.includes('\0') || pathname.split('/').includes('..')) {
      next();
      return;
    }

    const relative = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    const candidates = relative
      ? [`${relative}.html`, join(relative, 'index.html')]
      : ['index.html'];

    for (const candidate of candidates) {
      const file = join(prerender, candidate);
      if (existsSync(file)) {
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.sendFile(file);
        return;
      }
    }

    const fallback = join(webDist, 'index.html');
    if (existsSync(fallback)) {
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.sendFile(fallback);
      return;
    }

    next();
  });
}
