import { useParams } from 'react-router-dom';
import { ErrorMessage } from '../components/ErrorMessage';
import { Pagination } from '../components/Pagination';
import { PostCard } from '../components/PostCard';
import { PostListSkeleton } from '../components/Skeletons';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePosts } from '../hooks/useApi';

export function HomePage() {
  const params = useParams();
  const parsed = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const { data, loading, error, reload } = usePosts(page);

  useDocumentTitle(page > 1 ? `Página ${page}` : undefined);

  return (
    <div className="container-page py-12 sm:py-16">
      {page === 1 && (
        <section className="max-w-2xl">
          <p className="font-mono text-sm font-medium text-accent-strong dark:text-indigo-300">
            Notas do Thiago
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl dark:text-night-ink">
            Ideias que merecem ficar.
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted dark:text-night-muted">
            Anotações sobre desenvolvimento de software, Node.js, React e as pequenas decisões que
            fazem um projeto durar.
          </p>
        </section>
      )}

      <section aria-labelledby="posts-title" className={page === 1 ? 'mt-14' : ''}>
        <div className="flex items-baseline justify-between gap-4">
          <h1
            id="posts-title"
            className="font-serif text-2xl font-semibold text-ink dark:text-night-ink"
          >
            {page === 1 ? 'Posts recentes' : `Página de listagem ${page}`}
          </h1>
          {data && (
            <p className="text-sm text-muted dark:text-night-muted">
              {data.total} {data.total === 1 ? 'Post' : 'Posts'}
            </p>
          )}
        </div>

        <div className="mt-6 space-y-5">
          {loading && <PostListSkeleton />}
          {error && <ErrorMessage message="Não foi possível carregar os Posts." onRetry={reload} />}
          {data?.posts.length === 0 && (
            <p className="surface-card p-6 text-muted dark:text-night-muted">
              Nenhum Post publicado ainda.
            </p>
          )}
          {data?.posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        {data && <Pagination page={data.page} totalPages={data.totalPages} />}
      </section>
    </div>
  );
}
