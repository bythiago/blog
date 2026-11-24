interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  message = 'Não foi possível carregar este conteúdo.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div role="alert" className="surface-card p-6">
      <p className="font-medium text-ink dark:text-night-ink">{message}</p>
      <p className="mt-1 text-sm text-muted dark:text-night-muted">
        Verifique sua conexão e tente novamente.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
