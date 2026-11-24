/** Contratos compartilhados com a API (Fase 2). */
export interface PostSummary {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  readingTime: number;
  image?: string;
}

export interface Post extends PostSummary {
  body: string;
}

export interface PostsPage {
  posts: PostSummary[];
  page: number;
  totalPages: number;
  total: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

/** Item enxuto devolvido por `/api/search` para montar o índice local. */
export interface SearchIndexItem {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  text: string;
}

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
}
