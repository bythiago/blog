// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renderiza a Página Sobre pela rota /sobre', () => {
    window.history.pushState({}, '', '/sobre');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Sobre', level: 1 })).toBeInTheDocument();
  });

  it('renderiza 404 para rotas desconhecidas', () => {
    window.history.pushState({}, '', '/rota-inexistente');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Esta página não existe.' })).toBeInTheDocument();
  });
});
