import { Link } from 'react-router-dom';

interface PaginationProps {
  page: number;
  totalPages: number;
  tag?: string;
}

function pageHref(page: number, tag?: string): string {
  const base = tag ? `/tag/${encodeURIComponent(tag)}` : '';
  if (page <= 1) return base || '/';
  return `${base}/page/${page}`;
}

export function Pagination({ page, totalPages, tag }: PaginationProps) {
  if (totalPages <= 1) return null;

  const previous = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const linkClass =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent-strong dark:border-night-line dark:bg-night-surface dark:text-night-muted dark:hover:text-indigo-300';

  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-2">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 && (
          <li>
            <Link to={pageHref(previous, tag)} className={linkClass} aria-label="Página anterior">
              ← Anterior
            </Link>
          </li>
        )}

        {pages.map((number) => (
          <li key={number}>
            {number === page ? (
              <span
                aria-current="page"
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg bg-accent px-3 text-sm font-semibold text-white"
              >
                {number}
              </span>
            ) : (
              <Link
                to={pageHref(number, tag)}
                className={linkClass}
                aria-label={`Ir para a página ${number}`}
              >
                {number}
              </Link>
            )}
          </li>
        ))}

        {page < totalPages && (
          <li>
            <Link to={pageHref(next, tag)} className={linkClass} aria-label="Próxima página">
              Próxima →
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
