import type { ParsedPost, ParsedPostSummary, SearchIndexEntry } from '@blog/shared';
import { toSearchIndexEntry } from '@blog/shared';

export const POSTS_PER_PAGE = 10;

export interface ListOptions {
  page?: number;
  tag?: string;
  limit?: number;
}

export interface PostPage {
  posts: ParsedPostSummary[];
  page: number;
  totalPages: number;
  total: number;
}

/** Índice de conteúdo em memória:Posts por slug, por Tag e ordenados por data. */
export class ContentIndex {
  private posts: ParsedPost[] = [];
  private bySlug = new Map<string, ParsedPost>();
  private byTag = new Map<string, ParsedPost[]>();

  replace(posts: ParsedPost[]): void {
    this.posts = [...posts].sort(
      (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug, 'pt-BR'),
    );
    this.bySlug = new Map(this.posts.map((post) => [post.slug, post]));
    this.byTag = new Map();

    for (const post of this.posts) {
      for (const tag of post.tags) {
        const tagged = this.byTag.get(tag) ?? [];
        tagged.push(post);
        this.byTag.set(tag, tagged);
      }
    }
  }

  get size(): number {
    return this.posts.length;
  }

  all(): readonly ParsedPost[] {
    return this.posts;
  }

  getBySlug(slug: string): ParsedPost | undefined {
    return this.bySlug.get(slug);
  }

  list({ page = 1, tag, limit = POSTS_PER_PAGE }: ListOptions = {}): PostPage {
    const source = tag ? (this.byTag.get(tag) ?? []) : this.posts;
    const total = source.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const start = (page - 1) * limit;

    return {
      posts: source.slice(start, start + limit).map(toSummary),
      page,
      totalPages,
      total,
    };
  }

  tags(): Array<{ tag: string; count: number }> {
    return [...this.byTag.entries()]
      .map(([tag, posts]) => ({ tag, count: posts.length }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'pt-BR'));
  }

  search(): SearchIndexEntry[] {
    return this.posts.map(toSearchIndexEntry);
  }
}

export function toSummary(post: ParsedPost): ParsedPostSummary {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    summary: post.summary,
    ...(post.image ? { image: post.image } : {}),
    readingTime: post.readingTime,
  };
}
