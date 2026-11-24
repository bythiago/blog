import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkContent } from './content-check';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function withTempDir<T>(callback: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'blog-content-check-'));
  try {
    return await callback(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

interface FonteOptions {
  tags?: string[];
  image?: string;
  omitSummary?: boolean;
}

function fonte(slug: string, options: FonteOptions = {}): string {
  const lines = [
    '---',
    "title: 'Fonte de teste'",
    "date: '2026-01-01'",
    `slug: '${slug}'`,
    `tags: [${(options.tags ?? ['testes']).map((tag) => `'${tag}'`).join(', ')}]`,
  ];
  if (!options.omitSummary) lines.push("summary: 'Resumo da Fonte de teste.'");
  if (options.image) lines.push(`image: '${options.image}'`);
  lines.push('---', '', '# Corpo', '', 'Texto da Fonte.', '');
  return lines.join('\n');
}

function runContentCheck(dir: string) {
  return spawnSync('npm', ['run', 'content:check', '--', '--dir', dir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

describe('checkContent', () => {
  it('Fonte válida passa e resume Fontes e Tags sem duplicatas', async () => {
    await withTempDir(async (dir) => {
      await mkdir(join(dir, 'images'), { recursive: true });
      await writeFile(join(dir, 'uma-fonte.md'), fonte('uma-fonte', { tags: ['node', 'testes'] }));
      await writeFile(join(dir, 'outra-fonte.md'), fonte('outra-fonte', { tags: ['testes'] }));

      const result = await checkContent(dir);

      expect(result.issues).toEqual([]);
      expect(result.posts).toBe(2);
      expect(result.tags).toBe(2);
      expect(result.duplicates).toBe(0);
    });
  });

  it('frontmatter inválido falha com o arquivo e o motivo', async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, 'quebrada.md'), fonte('quebrada', { omitSummary: true }));

      const result = await checkContent(dir);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].file).toContain('quebrada.md');
      expect(result.issues[0].reason).toMatch(/Frontmatter inválido/);
    });
  });

  it('slug duplicado entre Fontes falha e aponta os dois arquivos', async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, 'primeira.md'), fonte('repetido'));
      await writeFile(join(dir, 'segunda.md'), fonte('repetido'));

      const result = await checkContent(dir);
      const duplicate = result.issues.find((issue) => issue.reason.includes('duplicado'));

      expect(duplicate).toBeDefined();
      expect(duplicate!.file).toContain('segunda.md');
      expect(duplicate!.reason).toContain('primeira.md');
      expect(result.duplicates).toBe(1);
    });
  });

  it('nome de arquivo divergente do slug falha', async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, 'nome-errado.md'), fonte('slug-correto'));

      const result = await checkContent(dir);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].file).toContain('nome-errado.md');
      expect(result.issues[0].reason).toMatch(/nome de arquivo/);
      expect(result.issues[0].reason).toContain('slug-correto.md');
    });
  });

  it('imagem inexistente em content/images falha', async () => {
    await withTempDir(async (dir) => {
      await mkdir(join(dir, 'images'), { recursive: true });
      await writeFile(
        join(dir, 'com-imagem.md'),
        fonte('com-imagem', { image: '/content/images/ausente.svg' }),
      );

      const result = await checkContent(dir);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].file).toContain('com-imagem.md');
      expect(result.issues[0].reason).toMatch(/image/);
      expect(result.issues[0].reason).toContain('ausente.svg');
    });
  });
});

describe('CLI content:check', () => {
  it('diretório válido termina com zero e imprime o resumo', async () => {
    await withTempDir(async (dir) => {
      await mkdir(join(dir, 'images'), { recursive: true });
      await writeFile(join(dir, 'valida.md'), fonte('valida', { tags: ['node'] }));

      const result = runContentCheck(dir);

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/1 Fonte\(s\)/);
      expect(result.stdout).toMatch(/Tag\(s\)/);
      expect(result.stdout).toMatch(/nenhuma duplicata/);
    });
  });

  it('diretório com Fonte quebrada termina com erro legível e código diferente de zero', async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, 'quebrada.md'), fonte('quebrada', { omitSummary: true }));

      const result = runContentCheck(dir);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('quebrada.md');
      expect(result.stderr).toMatch(/Frontmatter inválido/);
    });
  });
});
