import { parsePost } from '@blog/shared';
import { describe, expect, it } from 'vitest';
import { buildRoutes, dataForRoute, loadSiteConfig } from './site';

function makePost(index: number) {
  return parsePost(`---
title: "Post ${index}"
date: "2026-01-${String(index).padStart(2, '0')}"
slug: "post-${index}"
tags: ["tag-${index % 2}"]
summary: "Resumo do post ${index}"
---

# Post ${index}

Conteúdo do post ${index}.
`);
}

describe('rotas do build', () => {
  const posts = Array.from({ length: 12 }, (_, index) => makePost(index + 1));
  const routes = buildRoutes(loadSiteConfig(), posts);

  it('gera Posts, páginas de listagem, tags e páginas estáticas', () => {
    expect(routes.filter((route) => route.type === 'article')).toHaveLength(12);
    expect(routes.some((route) => route.path === '/')).toBe(true);
    expect(routes.some((route) => route.path === '/page/2')).toBe(true);
    expect(routes.some((route) => route.path === '/tag/tag-0')).toBe(true);
    expect(routes.some((route) => route.path === '/sobre')).toBe(true);
  });

  it('injeta o conteúdo do Post e da listagem no HTML', () => {
    const postRoute = routes.find((route) => route.path === '/posts/post-1');
    expect(dataForRoute(postRoute!, posts)).toMatchObject({
      post: { slug: 'post-1', title: 'Post 1', body: '# Post 1\n\nConteúdo do post 1.' },
    });

    const pageRoute = routes.find((route) => route.path === '/page/2');
    const data = dataForRoute(pageRoute!, posts);
    expect(data.pages?.['2'].posts).toHaveLength(2);
    expect(data.pages?.['2'].totalPages).toBe(2);
  });
});
