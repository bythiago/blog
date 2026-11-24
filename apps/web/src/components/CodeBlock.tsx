import { useEffect, useRef, useState, type ReactNode } from 'react';

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(codeRef.current?.textContent ?? '');
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="group relative mt-6">
      <button
        type="button"
        onClick={copy}
        aria-label="Copiar trecho de código"
        className="absolute right-3 top-3 z-10 rounded-lg border border-white/15 bg-zinc-800/90 px-2.5 py-1 text-xs font-medium text-zinc-200 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
      >
        {copied ? 'Copiado' : 'Copiar'}
      </button>
      <pre className="overflow-x-auto rounded-lg border border-line bg-zinc-950 p-4 text-sm leading-6 text-zinc-100 dark:border-night-line">
        <code ref={codeRef} className={className}>
          {children}
        </code>
      </pre>
    </div>
  );
}
