import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Falha ao renderizar a interface:', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main
          id="conteudo"
          role="alert"
          className="container-page flex min-h-[60vh] flex-col items-start justify-center py-20"
        >
          <p className="font-mono text-sm font-semibold text-accent-strong dark:text-indigo-300">
            Erro inesperado
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-ink dark:text-night-ink">
            Não foi possível exibir esta página.
          </h1>
          <p className="mt-3 max-w-reading leading-7 text-muted dark:text-night-muted">
            Ocorreu uma falha ao renderizar a interface. Você pode tentar novamente sem perder o
            endereço atual.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-7 rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-strong"
          >
            Tentar novamente
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
