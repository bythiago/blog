import { describe, expect, it } from 'vitest';
import { frontmatterSchema } from '../src/frontmatter';

const validFrontmatter = {
  title: 'Primeiro post',
  date: '2026-11-23',
  tags: ['node', 'typescript'],
  summary: 'Um resumo sobre Node e TypeScript.',
  slug: 'primeiro-post',
};

describe('frontmatterSchema', () => {
  it('valida um frontmatter completo', () => {
    expect(frontmatterSchema.parse(validFrontmatter)).toEqual(validFrontmatter);
  });

  it('aceita image opcional', () => {
    const parsed = frontmatterSchema.parse({ ...validFrontmatter, image: '/images/capa.png' });
    expect(parsed.image).toBe('/images/capa.png');
  });

  it('rejeita data fora do formato ISO 8601', () => {
    expect(() => frontmatterSchema.parse({ ...validFrontmatter, date: '23/11/2026' })).toThrowError(
      /ISO 8601/,
    );
  });

  it('rejeita data inexistente', () => {
    expect(() => frontmatterSchema.parse({ ...validFrontmatter, date: '2026-02-30' })).toThrowError(
      /data válida/,
    );
  });

  it('rejeita slug com espaços', () => {
    expect(() =>
      frontmatterSchema.parse({ ...validFrontmatter, slug: 'Primeiro Post' }),
    ).toThrowError(/slug/);
  });
});
