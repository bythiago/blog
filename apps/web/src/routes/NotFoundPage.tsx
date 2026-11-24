import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Página não encontrada');

  return (
    <section className="container-page flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="font-mono text-sm font-semibold text-accent-strong dark:text-indigo-300">404</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-ink dark:text-night-ink">
        Esta página não existe.
      </h1>
      <p className="mt-4 max-w-reading leading-8 text-muted dark:text-night-muted">
        O endereço pode ter mudado ou o Post pode não ter sido publicado. Volte ao início e continue
        de lá.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong"
      >
        Ir para o início
      </Link>
    </section>
  );
}
