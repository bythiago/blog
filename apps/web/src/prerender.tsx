import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppRoutes } from './App';
import { Layout } from './components/Layout';
import { PrerenderDataContext, type PrerenderData } from './prerender-data';

/**
 * Renderiza uma rota da SPA no servidor com os dados já carregados no build.
 * Não usa `BrowserRouter` (depende de `window`) nem efeitos colaterais.
 */
export function renderAppMarkup(path: string, data: PrerenderData): string {
  return renderToStaticMarkup(
    <PrerenderDataContext.Provider value={data}>
      <StaticRouter location={path}>
        <Layout>
          <AppRoutes />
        </Layout>
      </StaticRouter>
    </PrerenderDataContext.Provider>,
  );
}
