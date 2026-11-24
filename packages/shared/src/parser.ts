import { frontmatterSchema, type Frontmatter } from './frontmatter.js';

/** Post processado a partir de uma Fonte, pronto para navegação e busca. */
export interface ParsedPost extends Frontmatter {
  /** Corpo do Post em Markdown, sem o frontmatter. */
  body: string;
  /** Texto sem marcações usado pelo Índice de busca. */
  text: string;
  /** Tempo estimado de leitura em minutos (no mínimo 1). */
  readingTime: number;
}

/** Post resumido para listagens (sem Corpo nem texto de busca). */
export type ParsedPostSummary = Omit<ParsedPost, 'body' | 'text'>;

/** Entrada compacta devolvida por GET /api/search. */
export type SearchIndexEntry = Pick<ParsedPost, 'slug' | 'title' | 'summary' | 'tags' | 'text'>;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Parse minimalista de frontmatter: pares `chave: valor` e listas `[a, b]`. */
function parseFrontmatterBlock(block: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      result[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => unquote(item.trim()))
        .filter(Boolean);
      continue;
    }

    result[key] = unquote(value);
  }

  return result;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

/** Remove marcações do Markdown mantendo as palavras úteis para a busca. */
export function extractSearchText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/^```[^\n]*\n?/m, '').replace(/```$/m, ''))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function estimateReadingTime(text: string, wordsPerMinute = 200): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/** Valida o frontmatter com zod e monta o Post a partir do texto de uma Fonte. */
export function parsePost(source: string): ParsedPost {
  const match = FRONTMATTER.exec(source);
  if (!match) {
    throw new Error('Fonte sem frontmatter delimitado por ---');
  }

  const frontmatter = frontmatterSchema.safeParse(parseFrontmatterBlock(match[1]));
  if (!frontmatter.success) {
    const details = frontmatter.error.issues
      .map((issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Frontmatter inválido: ${details}`);
  }

  const body = source.slice(match[0].length).trim();
  const text = extractSearchText(body);

  return {
    ...frontmatter.data,
    body,
    text,
    readingTime: estimateReadingTime(text),
  };
}

export function toSearchIndexEntry(post: ParsedPost): SearchIndexEntry {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    tags: post.tags,
    text: post.text,
  };
}
