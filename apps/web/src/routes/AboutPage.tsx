import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function AboutPage() {
  useDocumentTitle('Sobre');

  return (
    <article className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-reading">
        <p className="font-mono text-sm font-medium text-accent-strong dark:text-indigo-300">
          Página
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-ink dark:text-night-ink">
          Sobre
        </h1>

        <div className="prose-blog mt-10">
          <p>
            Este é o <strong>Notas do Thiago</strong>: um espaço para registrar o que aprendo sobre
            desenvolvimento de software — principalmente Node.js, React e as decisões de arquitetura
            que aparecem no caminho.
          </p>
          <h2>Por que escrever?</h2>
          <p>
            Porque uma ideia anotada sobrevive melhor do que uma ideia lembrada. Os Posts são
            curtos, escritos em Markdown e versionados junto com o código do site. Publicar é um ato
            tão simples quanto um commit.
          </p>
          <h2>Como navegar</h2>
          <p>
            Use a listagem inicial para ver os Posts mais recentes, explore as{' '}
            <Link to="/tags">Tags</Link> por assunto ou faça uma busca pelo termo que você procura.
            Tudo funciona por teclado, com um atalho para pular direto ao conteúdo.
          </p>
        </div>

        <nav aria-label="Navegação da Página Sobre" className="mt-12">
          <Link to="/" className="text-link">
            ← Voltar para os Posts
          </Link>
        </nav>
      </div>
    </article>
  );
}
