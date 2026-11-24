import { Router } from 'express';
import type { ContentIndex } from '../content/index.js';

export function searchRouter(index: ContentIndex): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json(index.search());
  });
  return router;
}
