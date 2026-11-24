import { describe, expect, it } from 'vitest';
import { slugify } from '../src/slugify';

describe('slugify', () => {
  it('remove acentos e normaliza para minúsculas', () => {
    expect(slugify('Notas do Thiago — Café')).toBe('notas-do-thiago-cafe');
  });

  it('colapsa separadores e remove hífens nas bordas', () => {
    expect(slugify('  TypeScript   em  2026!  ')).toBe('typescript-em-2026');
  });

  it('gera um slug compatível com o schema de frontmatter', () => {
    expect(slugify('Olá, Mundo!')).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});
