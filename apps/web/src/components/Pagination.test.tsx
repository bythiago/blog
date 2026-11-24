// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('marca a página atual e links de navegação com nomes acessíveis', () => {
    render(
      <MemoryRouter>
        <Pagination page={2} totalPages={3} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument();
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Página anterior' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Próxima página' })).toHaveAttribute('href', '/page/3');
  });

  it('não renderiza nada com uma única página', () => {
    const { container } = render(
      <MemoryRouter>
        <Pagination page={1} totalPages={1} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
