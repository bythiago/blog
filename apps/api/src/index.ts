import { createApp } from './app.js';
import { mountStatic } from './static.js';
import { loadConfig } from './config.js';
import { ContentIndex } from './content/index.js';
import { loadContentIntoIndex, resolveContentDir } from './content/loader.js';
import { startWatcher } from './content/watcher.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const index = new ContentIndex();
  const contentDir = resolveContentDir();

  await loadContentIntoIndex(index, contentDir);
  const watcher = startWatcher(index, contentDir);

  const app = createApp({ index, nodeEnv: config.NODE_ENV });
  mountStatic(app);
  const server = app.listen(config.PORT, () => {
    console.log(`API pronta em http://localhost:${config.PORT} com ${index.size} Posts`);
    console.log(
      watcher ? 'Watcher de conteúdo ativo (development)' : 'Watcher de conteúdo desativado',
    );
  });

  const shutdown = () => {
    void watcher?.close();
    server.close();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void main().catch((error: unknown) => {
  console.error('Falha ao iniciar a API:', error);
  process.exitCode = 1;
});
