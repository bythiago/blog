import type { Post, PostsPage, SearchIndexItem, TagCount } from './types';

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Não foi possível carregar ${path} (HTTP ${response.status}).`);
  }

  return (await response.json()) as T;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export async function getPosts(options: {
  page?: number;
  tag?: string;
  signal?: AbortSignal;
}): Promise<PostsPage> {
  const params = new URLSearchParams({ page: String(options.page ?? 1) });
  if (options.tag) params.set('tag', options.tag);
  return getJson<PostsPage>(`/api/posts?${params.toString()}`, options.signal);
}

export async function getPost(slug: string, signal?: AbortSignal): Promise<Post> {
  return getJson<Post>(`/api/posts/${encodeURIComponent(slug)}`, signal);
}

export async function getTags(signal?: AbortSignal): Promise<TagCount[]> {
  return getJson<TagCount[]>('/api/tags', signal);
}

export async function getSearchIndex(signal?: AbortSignal): Promise<SearchIndexItem[]> {
  return getJson<SearchIndexItem[]>('/api/search', signal);
}

export { toError };
