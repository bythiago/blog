import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSearchIndex, toError } from '../lib/api';
import { createCachedIndexLoader, createSearchEngine, type SearchIndexLoader } from '../lib/search';
import type { SearchIndexItem } from '../lib/types';

const defaultLoadIndex: SearchIndexLoader = createCachedIndexLoader(getSearchIndex);

interface SearchBoxProps {
  /** Permite injetar o carregador (testes) sem alterar o comportamento padrão. */
  loadIndex?: SearchIndexLoader;
  className?: string;
  /** Identificador único quando há mais de uma instância na página. */
  id?: string;
}

export function SearchBox({
  loadIndex = defaultLoadIndex,
  className = '',
  id = 'blog-search',
}: SearchBoxProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchIndexItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const indexRequested = useRef(false);

  // O índice é baixado uma única vez, no primeiro foco — nunca por tecla.
  useEffect(() => {
    if (!open || indexRequested.current) return;
    let cancelled = false;
    indexRequested.current = true;
    setLoading(true);
    loadIndex()
      .then(
        (items) => {
          if (cancelled) return;
          setIndex(items);
        },
        (reason: unknown) => {
          if (!cancelled) setError(toError(reason).message);
        },
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, loadIndex]);

  const engine = useMemo(() => (index ? createSearchEngine(index) : null), [index]);
  const results = useMemo(() => (engine ? engine.search(query) : []), [engine, query]);

  useEffect(() => {
    setActive(-1);
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (!results.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = results[active >= 0 ? active : 0];
      if (chosen) {
        navigate(`/posts/${encodeURIComponent(chosen.slug)}`);
        setQuery('');
        close();
      }
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div className={`relative ${className}`} onBlur={handleBlur}>
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor={id} className="sr-only">
          Buscar Posts
        </label>
        <input
          id={id}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          placeholder="Buscar…"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={`${id}-results`}
          aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
          className="h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink placeholder:text-zinc-400 focus:border-accent dark:border-night-line dark:bg-night-surface dark:text-night-ink dark:placeholder:text-zinc-500"
        />
      </form>

      {showPanel && (
        <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2.5rem))] rounded-lg border border-line bg-surface p-2 shadow-xl dark:border-night-line dark:bg-night-surface">
          {loading && (
            <p className="px-3 py-3 text-sm text-muted dark:text-night-muted">
              Carregando índice de busca…
            </p>
          )}

          {error && (
            <p role="alert" className="px-3 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          {!loading && !error && results.length > 0 && (
            <ul
              id={`${id}-results`}
              role="listbox"
              aria-label="Resultados da busca"
              className="max-h-80 overflow-auto"
            >
              {results.map((item, position) => (
                <li
                  key={item.slug}
                  id={`${id}-option-${position}`}
                  role="option"
                  aria-selected={position === active}
                >
                  <Link
                    to={`/posts/${encodeURIComponent(item.slug)}`}
                    onClick={() => {
                      setQuery('');
                      close();
                    }}
                    onMouseEnter={() => setActive(position)}
                    className={`block rounded-lg px-3 py-2 ${
                      position === active ? 'bg-accent-soft dark:bg-accent/20' : ''
                    }`}
                  >
                    <span className="block text-sm font-medium text-ink dark:text-night-ink">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-xs text-muted dark:text-night-muted">
                      {item.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!loading && !error && index && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted dark:text-night-muted">
              Nenhum Post encontrado para “{query}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
