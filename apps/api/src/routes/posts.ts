import { Router, type Request, type Response } from 'express';
import { POSTS_PER_PAGE, type ContentIndex } from '../content/index.js';

function readPage(req: Request, res: Response): number | null {
  const raw = req.query.page;
  if (raw === undefined) return 1;

  if (typeof raw !== 'string' || !/^\d+$/.test(raw) || Number(raw) < 1) {
    res.status(400).json({ error: 'page deve ser um inteiro positivo' });
    return null;
  }

  return Number(raw);
}

export function postsRouter(index: ContentIndex): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const page = readPage(req, res);
    if (page === null) return;

    const rawTag = req.query.tag;
    if (rawTag !== undefined && typeof rawTag !== 'string') {
      res.status(400).json({ error: 'tag deve ser um texto' });
      return;
    }

    res.json(index.list({ page, tag: rawTag, limit: POSTS_PER_PAGE }));
  });

  router.get('/:slug', (req, res) => {
    const post = index.getBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ error: `Post não encontrado: ${req.params.slug}` });
      return;
    }

    res.json(post);
  });

  return router;
}
