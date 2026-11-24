import { Link } from 'react-router-dom';
import { ErrorMessage } from '../components/ErrorMessage';
import { TagsSkeleton } from '../components/Skeletons';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTags } from '../hooks/useApi';

export function TagsPage() {
  const { data, loading, error, reload } = useTags();
  useDocumentTitle('Tags');

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="font-mono text-sm font-medium text-accent-strong dark:text-indigo-300">
          Navegação
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Tags
        </h1>
        <p className="mt-4 leading-8 text-muted dark:text-night-muted">
          Os assuntos que aparecem nos Posts. Escolha um para ver tudo que foi escrito sobre ele.
        </p>
      </header>

      <section aria-labelledby="tags-list-title" className="mt-12">
        <h2 id="tags-list-title" className="sr-only">
          Todas as Tags
        </h2>
        {loading && <TagsSkeleton />}
        {error && <ErrorMessage message="Não foi possível carregar as Tags." onRetry={reload} />}
        {data && data.length === 0 && (
          <p className="text-muted dark:text-night-muted">Nenhuma Tag cadastrada.</p>
        )}
        {data && data.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {data.map(({ tag, count }) => (
              <li key={tag}>
                <Link
                  to={`/tag/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent-strong dark:border-night-line dark:bg-night-surface dark:text-night-ink dark:hover:text-indigo-300"
                >
                  <span>#{tag}</span>
                  <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted dark:bg-night dark:text-night-muted">
                    {count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
