// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { SearchIndexItem } from '../lib/types';
import { SearchBox } from './SearchBox';

const index: SearchIndexItem[] = [
  {
    slug: 'usando-react',
    title: 'Usando React',
    summary: 'Componentes e estado.',
    tags: ['react'],
    text: 'hooks e componentes',
  },
  {
    slug: 'node-na-pratica',
    title: 'Node na prática',
    summary: 'Servidor e rotas.',
    tags: ['node'],
    text: 'express e rotas',
  },
];

function renderSearch(loadIndex: () => Promise<SearchIndexItem[]> = vi.fn(async () => index)) {
  render(
    <MemoryRouter>
      <SearchBox loadIndex={loadIndex} />
    </MemoryRouter>,
  );
  return screen.getByRole('combobox', { name: 'Buscar Posts' });
}

describe('SearchBox', () => {
  it('filtra localmente e baixa o índice apenas uma vez', async () => {
    const loadIndex = vi.fn(async () => index);
    const input = renderSearch(loadIndex);

    await userEvent.type(input, 'react');
    expect(await screen.findByRole('option')).toHaveTextContent('Usando React');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(loadIndex).toHaveBeenCalledTimes(1);

    await userEvent.clear(input);
    await userEvent.type(input, 'node');
    expect(await screen.findByRole('option')).toHaveTextContent('Node na prática');
    expect(loadIndex).toHaveBeenCalledTimes(1);
  });

  it('informa quando não há resultados', async () => {
    const input = renderSearch();
    await userEvent.type(input, 'qwertyuiop');
    expect(await screen.findByText(/Nenhum Post encontrado/)).toBeInTheDocument();
  });
});
