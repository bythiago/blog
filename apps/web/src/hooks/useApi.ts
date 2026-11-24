import { useCallback, useEffect, useState } from 'react';
import { getPost, getPosts, getTags, isAbortError, toError } from '../lib/api';
import type { AsyncState, Post, PostsPage, TagCount } from '../lib/types';
import { postsPageKey, usePrerenderData } from '../prerender-data';

function idle<T>(): AsyncState<T> {
  return { data: undefined, loading: true, error: null };
}

/** `reload` não faz sentido quando os dados vieram do HTML pré-renderizado. */
const noReload = (): void => {};

export interface PostsResult extends AsyncState<PostsPage> {
  reload: () => void;
}

export function usePosts(page: number, tag?: string): PostsResult {
  const [state, setState] = useState<AsyncState<PostsPage>>(idle);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((value) => value + 1), []);
  const injected = usePrerenderData()?.pages?.[postsPageKey(page, tag)];

  useEffect(() => {
    if (injected) return;
    const controller = new AbortController();
    setState(idle());
    getPosts({ page, tag, signal: controller.signal }).then(
      (data) => setState({ data, loading: false, error: null }),
      (error: unknown) => {
        if (!isAbortError(error))
          setState({ data: undefined, loading: false, error: toError(error) });
      },
    );
    return () => controller.abort();
  }, [page, tag, nonce, injected]);

  if (injected) return { data: injected, loading: false, error: null, reload: noReload };
  return { ...state, reload };
}

export interface PostResult extends AsyncState<Post> {
  reload: () => void;
}

export function usePost(slug: string): PostResult {
  const [state, setState] = useState<AsyncState<Post>>(idle);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((value) => value + 1), []);
  const prerenderPost = usePrerenderData()?.post;
  const injected = prerenderPost?.slug === slug ? prerenderPost : undefined;

  useEffect(() => {
    if (injected) return;
    const controller = new AbortController();
    setState(idle());
    getPost(slug, controller.signal).then(
      (data) => setState({ data, loading: false, error: null }),
      (error: unknown) => {
        if (!isAbortError(error))
          setState({ data: undefined, loading: false, error: toError(error) });
      },
    );
    return () => controller.abort();
  }, [slug, nonce, injected]);

  if (injected) return { data: injected, loading: false, error: null, reload: noReload };
  return { ...state, reload };
}

export interface TagsResult extends AsyncState<TagCount[]> {
  reload: () => void;
}

export function useTags(): TagsResult {
  const [state, setState] = useState<AsyncState<TagCount[]>>(idle);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((value) => value + 1), []);
  const injected = usePrerenderData()?.tags;

  useEffect(() => {
    if (injected) return;
    const controller = new AbortController();
    setState(idle());
    getTags(controller.signal).then(
      (data) => setState({ data, loading: false, error: null }),
      (error: unknown) => {
        if (!isAbortError(error))
          setState({ data: undefined, loading: false, error: toError(error) });
      },
    );
    return () => controller.abort();
  }, [nonce, injected]);

  if (injected) return { data: injected, loading: false, error: null, reload: noReload };
  return { ...state, reload };
}
