import { createContext, useContext } from 'react';
import type { Post, PostsPage, TagCount } from './lib/types';

/**
 * Dados já carregados no build. Quando presentes, os hooks de API devolvem o
 * conteúdo sincronamente para que `react-dom/server` gere HTML com o Corpo real.
 */
export interface PrerenderData {
  /** Chave: número da página (`1`, `2`, …) ou `tag:<tag>:<página>`. */
  pages?: Record<string, PostsPage>;
  post?: Post;
  tags?: TagCount[];
}

export const PrerenderDataContext = createContext<PrerenderData | undefined>(undefined);

export function usePrerenderData(): PrerenderData | undefined {
  return useContext(PrerenderDataContext);
}

export function postsPageKey(page: number, tag?: string): string {
  return tag ? `tag:${tag}:${page}` : String(page);
}
