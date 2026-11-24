import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { Theme } from '../hooks/useTheme';
import { SearchBox } from './SearchBox';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'text-accent-strong dark:text-indigo-300'
      : 'text-muted hover:text-ink dark:text-night-muted dark:hover:text-night-ink'
  }`;

const navItems = [
  { to: '/', label: 'Início', end: true },
  { to: '/tags', label: 'Tags', end: false },
  { to: '/sobre', label: 'Sobre', end: false },
];

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur dark:border-night-line dark:bg-night/90">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link
          to="/"
          className="shrink-0 font-serif text-xl font-semibold tracking-tight text-ink dark:text-night-ink"
        >
          Notas <span className="text-accent-strong dark:text-indigo-300">do</span> Thiago
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SearchBox className="hidden w-32 sm:block sm:w-56" />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-muted sm:hidden dark:border-night-line dark:bg-night-surface dark:text-night-muted"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              {menuOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="menu-mobile"
          aria-label="Navegação principal (mobile)"
          className="border-t border-line sm:hidden dark:border-night-line"
        >
          <ul className="container-page flex flex-col py-2">
            <li className="pb-2 sm:hidden">
              <SearchBox id="blog-search-mobile" className="w-full" />
            </li>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
