import { Link, useParams } from 'react-router-dom';
import { ErrorMessage } from '../components/ErrorMessage';
import { Pagination } from '../components/Pagination';
import { PostCard } from '../components/PostCard';
import { PostListSkeleton } from '../components/Skeletons';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePosts } from '../hooks/useApi';

export function TagPage() {
  const params = useParams();
  const tag = params.tag ?? '';
  const parsed = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const { data, loading, error, reload } = usePosts(page, tag);

  useDocumentTitle(`Tag: ${tag}`);

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="font-mono text-sm font-medium text-accent-strong dark:text-indigo-300">
          Filtrando por Tag
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-ink dark:text-night-ink">
          #{tag}
        </h1>
        <p className="mt-4">
          <Link to="/tags" className="text-link">
            Ver todas as Tags
          </Link>
        </p>
      </header>

      <section aria-labelledby="tag-posts-title" className="mt-12">
        <h2 id="tag-posts-title" className="sr-only">
          Posts com a Tag {tag}
        </h2>
        <div className="space-y-5">
          {loading && <PostListSkeleton />}
          {error && (
            <ErrorMessage
              message="Não foi possível carregar os Posts desta Tag."
              onRetry={reload}
            />
          )}
          {data?.posts.length === 0 && (
            <p className="surface-card p-6 text-muted dark:text-night-muted">
              Nenhum Post com esta Tag.
            </p>
          )}
          {data?.posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
        {data && <Pagination page={data.page} totalPages={data.totalPages} tag={tag} />}
      </section>
    </div>
  );
}
