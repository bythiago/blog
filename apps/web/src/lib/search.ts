import Fuse from 'fuse.js';
import type { SearchIndexItem } from './types';

export interface SearchEngine {
  search: (query: string, limit?: number) => SearchIndexItem[];
}

/**
 * Cria o mecanismo de busca sobre o índice já baixado de `/api/search`.
 * Nenhuma requisição é feita aqui: a filtragem é inteiramente local.
 */
export function createSearchEngine(index: SearchIndexItem[]): SearchEngine {
  const fuse = new Fuse(index, {
    keys: [
      { name: 'title', weight: 0.45 },
      { name: 'tags', weight: 0.2 },
      { name: 'summary', weight: 0.2 },
      { name: 'text', weight: 0.15 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  return {
    search(query, limit = 8) {
      const term = query.trim();
      if (term.length < 2) return [];
      return fuse.search(term, { limit }).map((result) => result.item);
    },
  };
}

/** Cache em memória do índice de busca: uma única requisição por sessão. */
let cachedIndexPromise: Promise<SearchIndexItem[]> | undefined;

export interface SearchIndexLoader {
  (signal?: AbortSignal): Promise<SearchIndexItem[]>;
}

export function createCachedIndexLoader(loader: SearchIndexLoader): SearchIndexLoader {
  return (signal) => {
    if (!cachedIndexPromise) cachedIndexPromise = loader(signal);
    return cachedIndexPromise;
  };
}
