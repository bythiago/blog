// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownView } from './MarkdownView';

describe('MarkdownView', () => {
  it('renderiza GFM e blocos de código', () => {
    const content = [
      '## Título',
      '',
      '| A | B |',
      '| - | - |',
      '| 1 | 2 |',
      '',
      '```js',
      'const x = 1;',
      '```',
    ].join('\n');

    const { container } = render(<MarkdownView content={content} />);

    expect(screen.getByRole('heading', { name: 'Título', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(container.querySelector('pre code')?.textContent).toContain('const x = 1;');
  });

  it('não executa HTML bruto vindo do Corpo', () => {
    const { container } = render(
      <MarkdownView content={'<script>alert(1)</script>\n\nTexto seguro'} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText(/Texto seguro/)).toBeInTheDocument();
  });
});
