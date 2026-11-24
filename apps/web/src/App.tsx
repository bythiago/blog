import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { AboutPage } from './routes/AboutPage';
import { HomePage } from './routes/HomePage';
import { NotFoundPage } from './routes/NotFoundPage';
import { PostPage } from './routes/PostPage';
import { TagPage } from './routes/TagPage';
import { TagsPage } from './routes/TagsPage';

/** Mapa de rotas compartilhado entre a SPA e o pré-render no build. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/page/:page" element={<HomePage />} />
      <Route path="/posts/:slug" element={<PostPage />} />
      <Route path="/tags" element={<TagsPage />} />
      <Route path="/tag/:tag" element={<TagPage />} />
      <Route path="/tag/:tag/page/:page" element={<TagPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
