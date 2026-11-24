import type { ReactNode } from 'react';

interface LoadingRegionProps {
  label?: string;
  children: ReactNode;
}

function LoadingRegion({ label = 'Carregando…', children }: LoadingRegionProps) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

const bar = 'rounded bg-zinc-200 dark:bg-zinc-700';

export function PostCardSkeleton() {
  return (
    <div className="surface-card animate-pulse p-5 sm:p-6">
      <div className={`h-3 w-40 ${bar}`} />
      <div className={`mt-4 h-7 w-3/4 ${bar}`} />
      <div className={`mt-4 h-4 w-full ${bar}`} />
      <div className={`mt-2 h-4 w-5/6 ${bar}`} />
      <div className="mt-5 flex gap-2">
        <div className={`h-6 w-16 rounded-full ${bar}`} />
        <div className={`h-6 w-20 rounded-full ${bar}`} />
      </div>
    </div>
  );
}

export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <LoadingRegion label="Carregando Posts…">
      <div className="space-y-5">
        {Array.from({ length: count }, (_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    </LoadingRegion>
  );
}

export function PostPageSkeleton() {
  return (
    <LoadingRegion label="Carregando Post…">
      <article className="mx-auto max-w-reading animate-pulse">
        <div className={`h-4 w-44 ${bar}`} />
        <div className={`mt-5 h-10 w-full ${bar}`} />
        <div className={`mt-2 h-10 w-2/3 ${bar}`} />
        <div className={`mt-8 h-4 w-full ${bar}`} />
        <div className={`mt-2 h-4 w-11/12 ${bar}`} />
        <div className={`mt-2 h-4 w-4/5 ${bar}`} />
        <div className={`mt-8 h-48 w-full ${bar}`} />
      </article>
    </LoadingRegion>
  );
}

export function TagsSkeleton() {
  return (
    <LoadingRegion label="Carregando Tags…">
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={`h-10 w-28 rounded-full ${bar} animate-pulse`} />
        ))}
      </div>
    </LoadingRegion>
  );
}
