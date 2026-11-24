import { Link } from 'react-router-dom';
import type { PostSummary } from '../lib/types';
import { formatDate } from '../lib/format';
import { TagBadge } from './TagBadge';

interface PostCardProps {
  post: PostSummary;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="surface-card p-5 transition-shadow hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted dark:text-night-muted">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime} min de leitura</span>
      </div>

      <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-ink dark:text-night-ink">
        <Link
          to={`/posts/${encodeURIComponent(post.slug)}`}
          className="text-link decoration-transparent hover:decoration-current"
        >
          {post.title}
        </Link>
      </h2>

      <p className="mt-2 leading-7 text-muted dark:text-night-muted">{post.summary}</p>

      {post.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Tags de ${post.title}`}>
          {post.tags.map((tag) => (
            <li key={tag}>
              <TagBadge tag={tag} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
