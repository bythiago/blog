import { Link, useParams } from 'react-router-dom';
import { ErrorMessage } from '../components/ErrorMessage';
import { MarkdownView } from '../components/MarkdownView';
import { PostPageSkeleton } from '../components/Skeletons';
import { TagBadge } from '../components/TagBadge';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePost } from '../hooks/useApi';
import { formatDate } from '../lib/format';

export function PostPage() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = usePost(slug);
  useDocumentTitle(data?.title);

  if (loading) {
    return (
      <div className="container-page py-12 sm:py-16">
        <PostPageSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-page py-12 sm:py-16">
        <ErrorMessage message="Não foi possível carregar este Post." onRetry={reload} />
      </div>
    );
  }

  return (
    <article className="container-page py-12 sm:py-16">
      <header className="mx-auto max-w-reading">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted dark:text-night-muted">
          <time dateTime={data.date}>{formatDate(data.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{data.readingTime} min de leitura</span>
        </div>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl dark:text-night-ink">
          {data.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted dark:text-night-muted">{data.summary}</p>
        {data.tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label={`Tags de ${data.title}`}>
            {data.tags.map((tag) => (
              <li key={tag}>
                <TagBadge tag={tag} />
              </li>
            ))}
          </ul>
        )}
      </header>

      <hr className="mx-auto mt-10 max-w-reading border-line dark:border-night-line" />

      <div className="mx-auto mt-10 max-w-reading">
        <MarkdownView content={data.body} />
      </div>

      <nav aria-label="Navegação do Post" className="mx-auto mt-14 max-w-reading">
        <Link to="/" className="text-link">
          ← Voltar para os Posts
        </Link>
      </nav>
    </article>
  );
}
