import type { Frontmatter } from './frontmatter';

export interface Post extends Frontmatter {
  body: string;
  readingMinutes: number;
}

export interface PostSummary {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  image?: string;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}
