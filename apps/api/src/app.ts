import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import type { ContentIndex } from './content/index.js';
import { healthRouter } from './routes/health.js';
import { postsRouter } from './routes/posts.js';
import { searchRouter } from './routes/search.js';
import { tagsRouter } from './routes/tags.js';
import { mountStatic, type StaticDirs } from './static.js';

export interface AppOptions {
  index: ContentIndex;
  nodeEnv?: string;
  staticDirs?: StaticDirs;
}

/** Monta a aplicação Express com rotas da API, CORS condicional e erros em JSON. */
export function createApp({
  index,
  nodeEnv = process.env.NODE_ENV ?? 'production',
  staticDirs,
}: AppOptions): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  if (nodeEnv === 'development') {
    app.use(cors());
  }

  app.use('/health', healthRouter());
  app.use('/api/posts', postsRouter(index));
  app.use('/api/tags', tagsRouter(index));
  app.use('/api/search', searchRouter(index));

  app.use('/api', (req, res) => {
    res.status(404).json({ error: `Rota não encontrada: ${req.path}` });
  });

  mountStatic(app, staticDirs);

  app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    const isJsonParseError =
      error instanceof SyntaxError &&
      (error as SyntaxError & { type?: string }).type === 'entity.parse.failed';
    const status = isJsonParseError ? 400 : 500;
    if (!isJsonParseError) console.error(error);

    res
      .status(status)
      .json({ error: isJsonParseError ? 'JSON inválido' : 'Erro interno do servidor' });
  });

  return app;
}
