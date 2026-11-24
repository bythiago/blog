import { Router } from 'express';
import type { ContentIndex } from '../content/index.js';

export function tagsRouter(index: ContentIndex): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json(index.tags());
  });
  return router;
}
