import { Link } from 'react-router-dom';

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Link
      to={`/tag/${encodeURIComponent(tag)}`}
      className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-strong transition-colors hover:bg-accent hover:text-white dark:bg-accent/15 dark:text-indigo-300 dark:hover:bg-accent dark:hover:text-white"
    >
      #{tag}
    </Link>
  );
}
