import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parsePost, type ParsedPost } from '@blog/shared';
import { ContentIndex } from './index.js';

/** Resolve a pasta de Fontes a partir do cwd da raiz ou do workspace apps/api. */
export function resolveContentDir(): string {
  const candidates = [
    process.env.CONTENT_DIR,
    resolve(process.cwd(), 'content'),
    resolve(process.cwd(), '..', '..', 'content'),
  ].filter((value): value is string => Boolean(value));

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`Diretório de conteúdo não encontrado. Tentei: ${candidates.join(', ')}`);
  }
  return found;
}

/** Lê todas as Fontes Markdown de `dir` e devolve os Posts já validados. */
export async function loadPosts(dir: string = resolveContentDir()): Promise<ParsedPost[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => join(dir, entry.name));

  return Promise.all(
    files.map(async (file) => {
      try {
        return parsePost(await readFile(file, 'utf8'));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Falha ao carregar ${file}: ${message}`);
      }
    }),
  );
}

/** Carrega as Fontes no boot e publica o resultado no índice em memória. */
export async function loadContentIntoIndex(
  index: ContentIndex,
  dir: string = resolveContentDir(),
): Promise<ContentIndex> {
  index.replace(await loadPosts(dir));
  return index;
}
