import chokidar, { type FSWatcher } from 'chokidar';
import type { ContentIndex } from './index.js';
import { loadContentIntoIndex, resolveContentDir } from './loader.js';

/**
 * Observa `content/` e recarrega o índice sem reiniciar o processo.
 * Em qualquer ambiente que não seja development, não inicializa watcher algum.
 */
export function startWatcher(
  index: ContentIndex,
  dir: string = resolveContentDir(),
): FSWatcher | null {
  if (process.env.NODE_ENV !== 'development') return null;

  const watcher = chokidar.watch(dir, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 25 },
  });

  let debounce: NodeJS.Timeout | undefined;
  const refresh = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      void loadContentIntoIndex(index, dir).catch((error: unknown) => {
        console.error('Falha ao recarregar conteúdo:', error);
      });
    }, 25);
  };

  watcher.on('add', refresh);
  watcher.on('change', refresh);
  watcher.on('unlink', refresh);

  return watcher;
}
