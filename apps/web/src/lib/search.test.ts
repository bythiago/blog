import { describe, expect, it } from 'vitest';
import { createSearchEngine } from './search';
import type { SearchIndexItem } from './types';

const index: SearchIndexItem[] = [
  {
    slug: 'react-sem-efeito',
    title: 'React sem efeito',
    summary: 'Como organizar componentes.',
    tags: ['react', 'frontend'],
    text: 'componentes hooks e estado',
  },
  {
    slug: 'node-em-producao',
    title: 'Node em produção',
    summary: 'Deploy enxuto com Docker.',
    tags: ['node', 'devops'],
    text: 'servidor express e logging',
  },
];

describe('createSearchEngine', () => {
  it('ignora consultas com menos de duas letras', () => {
    expect(createSearchEngine(index).search('r')).toEqual([]);
    expect(createSearchEngine(index).search('  ')).toEqual([]);
  });

  it('busca por título, tag e texto do índice local', () => {
    const engine = createSearchEngine(index);
    expect(engine.search('React')[0]?.slug).toBe('react-sem-efeito');
    expect(engine.search('devops')[0]?.slug).toBe('node-em-producao');
    expect(engine.search('logging')[0]?.slug).toBe('node-em-producao');
  });

  it('respeita o limite de resultados', () => {
    expect(createSearchEngine(index).search('node', 1)).toHaveLength(1);
  });
});
