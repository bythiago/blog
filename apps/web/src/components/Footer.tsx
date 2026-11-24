import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line dark:border-night-line">
      <div className="container-page flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between dark:text-night-muted">
        <p>
          © {new Date().getFullYear()} Notas do Thiago. Anotações sobre código, feitas com calma.
        </p>
        <nav aria-label="Rodapé">
          <ul className="flex gap-5">
            <li>
              <Link to="/" className="text-link">
                Início
              </Link>
            </li>
            <li>
              <Link to="/tags" className="text-link">
                Tags
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="text-link">
                Sobre
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
