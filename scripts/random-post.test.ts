import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePost, slugify, type ParsedPost } from '@blog/shared';
import { describe, expect, it, vi } from 'vitest';
import { generateRandomPost, RANDOM_POST_TAGS, runCli } from './random-post';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixedDate = '2026-11-23';

function runPostRandom(args: string[]) {
  return spawnSync('npm', ['run', 'post:random', '--', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

async function withTempDir<T>(callback: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'blog-random-post-'));
  try {
    return await callback(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function markdownFiles(dir: string): Promise<string[]> {
  return (await readdir(dir)).filter((name) => name.endsWith('.md')).sort();
}

async function snapshot(dir: string): Promise<Record<string, string>> {
  const names = await markdownFiles(dir);
  const entries = await Promise.all(
    names.map(async (name) => [name, await readFile(join(dir, name), 'utf8')] as const),
  );
  return Object.fromEntries(entries);
}

function slugsFromStdout(stdout: string): string[] {
  return [...stdout.matchAll(/\(slug: ([^)]+)\)/g)].map((match) => match[1]);
}

describe('função pura do gerador', () => {
  it('produz exatamente o mesmo texto para a mesma seed e a mesma data', () => {
    const first = generateRandomPost({ seed: 42, date: fixedDate });
    const second = generateRandomPost({ seed: 42, date: fixedDate });
    expect(second).toBe(first);
  });

  it('usa a data atual em UTC como padrão, sem depender do relógio real', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-11-23T23:59:59.000Z'));
      const before = generateRandomPost({ seed: 7 });
      expect(parsePost(before).date).toBe('2026-11-23');

      vi.setSystemTime(new Date('2026-11-24T00:00:00.000Z'));
      const after = generateRandomPost({ seed: 7 });
      expect(parsePost(after).date).toBe('2026-11-24');

      // A data não participa do sorteio: só o frontmatter muda ao virar o dia em UTC.
      expect(after.replace("date: '2026-11-24'", "date: '2026-11-23'")).toBe(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it('produz textos diferentes para seeds diferentes', () => {
    const texts = [0, 1, 2, 3, 7, 42, 999].map((seed) =>
      generateRandomPost({ seed, date: fixedDate }),
    );
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('rejeita seed não inteira e data fora do formato ISO', () => {
    expect(() => generateRandomPost({ seed: 1.5, date: fixedDate })).toThrow(/seed/);
    expect(() => generateRandomPost({ seed: 7, date: '2026-13-40' })).toThrow(/date/);
  });

  it('mantém as Tags pedidas e completa o restante com o conjunto fixo', () => {
    for (const seed of [0, 1, 2, 42, 99]) {
      const post = parsePost(
        generateRandomPost({ seed, date: fixedDate, tags: ['testes', 'docker'] }),
      );
      expect(post.tags).toContain('testes');
      expect(post.tags).toContain('docker');
      expect(new Set(post.tags).size).toBe(post.tags.length);
      expect(post.tags.every((tag) => (RANDOM_POST_TAGS as readonly string[]).includes(tag))).toBe(
        true,
      );
    }
  });

  it('rejeita Tag fora do conjunto fixo', () => {
    expect(() => generateRandomPost({ seed: 7, date: fixedDate, tags: ['inexistente'] })).toThrow(
      /Tag inválida: 'inexistente'/,
    );
  });

  it('aplica o prefixo sanitizado ao título, ao slug e ao Corpo', () => {
    const post = parsePost(generateRandomPost({ seed: 42, date: fixedDate, prefix: 'Notas:' }));
    expect(post.title).toMatch(/^Notas:\s/);
    expect(post.slug).toMatch(/^notas-/);
    expect(post.slug).toBe(slugify(post.title));
    expect(post.body).toContain(`# ${post.title}`);
  });

  it('sanitiza acentos e pontuação do prefixo antes de usá-lo no slug', () => {
    const post = parsePost(
      generateRandomPost({ seed: 42, date: fixedDate, prefix: '  RELATÓRIO final!! ' }),
    );
    expect(post.slug).toMatch(/^relatorio-final-/);
    expect(post.title).toMatch(/^RELATÓRIO final!!\s/);
  });

  it('diversidade: 200 seeds consecutivas têm ≥95% de slugs únicos e nenhum título acima de 3 ocorrências', () => {
    const posts = Array.from({ length: 200 }, (_, index) =>
      parsePost(generateRandomPost({ seed: 42 + index, date: fixedDate })),
    );
    const slugs = posts.map((post) => post.slug);
    const titles = posts.map((post) => post.title);
    const titleCounts = new Map<string, number>();
    for (const title of titles) titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);

    expect(new Set(slugs).size / slugs.length).toBeGreaterThanOrEqual(0.95);
    expect(Math.max(...titleCounts.values())).toBeLessThanOrEqual(3);
  });

  it('não usa termos banidos pelo glossário nos títulos gerados', () => {
    for (const seed of Array.from({ length: 200 }, (_, index) => index)) {
      const { title, summary } = parsePost(generateRandomPost({ seed, date: fixedDate }));
      expect(`${title} ${summary}`.toLowerCase()).not.toContain('deploy');
    }
  });
});

describe('Fonte gerada', () => {
  it.each([0, 1, 7, 42, 999])(
    'seed %i: parsePost aceita a Fonte e todos os campos obrigatórios estão presentes',
    (seed) => {
      const source = generateRandomPost({ seed, date: fixedDate });
      let post!: ParsedPost;
      expect(() => {
        post = parsePost(source);
      }).not.toThrow();

      expect(post.title.trim().length).toBeGreaterThan(0);
      expect(post.summary.trim().length).toBeGreaterThan(0);
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.date).toBe(fixedDate);
      expect(post.tags.length).toBeGreaterThan(0);
      expect(post.tags.every((tag) => tag.trim().length > 0)).toBe(true);
      expect(post.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(post.slug).toBe(slugify(post.title));
      expect(post.body).toMatch(/^#\s+\S/m);
      expect(post.body).toMatch(/```[a-z]*\n[\s\S]*?\n```/);
      expect(post.readingTime).toBeGreaterThanOrEqual(1);
      expect(post.image).toBeUndefined();
    },
  );
});

describe('CLI post:random', () => {
  it('mesma seed, mesma data e mesma lista de slugs existentes geram textos idênticos', () =>
    withTempDir((firstDir) =>
      withTempDir(async (secondDir) => {
        // A função pura não recebe os slugs existentes; a influência deles está na CLI.
        const collidingSlug = parsePost(generateRandomPost({ seed: 7, date: fixedDate })).slug;
        const previous = `slug existente: ${collidingSlug}\n`;
        for (const dir of [firstDir, secondDir]) {
          await writeFile(join(dir, `${collidingSlug}.md`), previous, 'utf8');
        }

        const args = (dir: string) => [
          '--out',
          dir,
          '--count',
          '2',
          '--seed',
          '7',
          '--date',
          fixedDate,
        ];
        const first = runPostRandom(args(firstDir));
        const second = runPostRandom(args(secondDir));
        expect(first.status).toBe(0);
        expect(second.status).toBe(0);
        expect(await snapshot(firstDir)).toEqual(await snapshot(secondDir));
        expect(await readFile(join(firstDir, `${collidingSlug}.md`), 'utf8')).toBe(previous);
        expect(await readFile(join(secondDir, `${collidingSlug}.md`), 'utf8')).toBe(previous);
      }),
    ));

  it('--count N gera N slugs distintos', () =>
    withTempDir(async (dir) => {
      const result = runPostRandom([
        '--out',
        dir,
        '--count',
        '5',
        '--seed',
        '42',
        '--date',
        fixedDate,
      ]);
      expect(result.status).toBe(0);

      const names = await markdownFiles(dir);
      expect(names).toHaveLength(5);
      const slugs = names.map((name) => name.replace(/\.md$/, ''));
      expect(new Set(slugs).size).toBe(5);
      for (const name of names) {
        const post = parsePost(await readFile(join(dir, name), 'utf8'));
        expect(post.slug).toBe(name.replace(/\.md$/, ''));
      }
    }));

  it('slug colidente é re-sorteado e a Fonte anterior permanece byte a byte', () =>
    withTempDir(async (dir) => {
      const source = generateRandomPost({ seed: 7, date: fixedDate });
      const collidingSlug = parsePost(source).slug;
      const original = [
        '---',
        "title: 'Fonte anterior'",
        `date: '${fixedDate}'`,
        `slug: '${collidingSlug}'`,
        "tags: ['testes']",
        "summary: 'Conteúdo anterior preservado.'",
        '---',
        '',
        '# Fonte anterior',
        '',
        'Conteúdo original.',
        '',
      ].join('\n');
      await writeFile(join(dir, `${collidingSlug}.md`), original, 'utf8');

      const result = runPostRandom([
        '--out',
        dir,
        '--count',
        '1',
        '--seed',
        '7',
        '--date',
        fixedDate,
      ]);
      expect(result.status).toBe(0);
      expect(result.stderr).toMatch(/já existe; re-sorteando/);
      expect(await readFile(join(dir, `${collidingSlug}.md`), 'utf8')).toBe(original);

      const generated = (await markdownFiles(dir)).filter((name) => name !== `${collidingSlug}.md`);
      expect(generated).toHaveLength(1);
      expect(generated[0]).not.toBe(`${collidingSlug}.md`);
      expect(parsePost(await readFile(join(dir, generated[0]), 'utf8')).slug).toBe(
        generated[0].replace(/\.md$/, ''),
      );
    }));

  it('--dry-run não cria nenhum arquivo', () =>
    withTempDir(async (dir) => {
      const result = runPostRandom([
        '--out',
        dir,
        '--count',
        '2',
        '--seed',
        '7',
        '--date',
        fixedDate,
        '--tag',
        'testes',
        '--dry-run',
      ]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('[dry-run]');
      expect(result.stdout).toMatch(/\(tags: [^)]*\btestes\b[^)]*\)/);
      expect(result.stdout).toContain('Simuladas 2 Fonte(s).');
      expect(await markdownFiles(dir)).toEqual([]);
    }));

  it('ponta a ponta: --count 3 --seed 7 cria três Fontes válidas e a segunda execução não duplica nem sobrescreve', () =>
    withTempDir(async (dir) => {
      const args = ['--out', dir, '--count', '3', '--seed', '7', '--date', fixedDate];
      const first = runPostRandom(args);
      expect(first.status).toBe(0);

      const names = await markdownFiles(dir);
      expect(names).toHaveLength(3);
      const firstSlugs = slugsFromStdout(first.stdout);
      expect(firstSlugs).toHaveLength(3);
      expect(new Set(firstSlugs).size).toBe(3);
      for (const name of names) {
        const post = parsePost(await readFile(join(dir, name), 'utf8'));
        expect(post.slug).toBe(name.replace(/\.md$/, ''));
      }

      const before = await snapshot(dir);
      const second = runPostRandom(args);
      expect(second.status).toBe(0);

      // Colisões são re-sorteadas para slugs novos: nada é sobrescrito e nenhum slug existente é repetido.
      for (const [name, content] of Object.entries(before)) {
        expect(await readFile(join(dir, name), 'utf8')).toBe(content);
      }
      const secondSlugs = slugsFromStdout(second.stdout);
      expect(secondSlugs).toHaveLength(3);
      expect(new Set(secondSlugs).size).toBe(3);
      expect(secondSlugs.some((slug) => firstSlugs.includes(slug))).toBe(false);

      const after = await snapshot(dir);
      for (const [name, content] of Object.entries(after)) {
        expect(parsePost(content).slug).toBe(name.replace(/\.md$/, ''));
      }
    }));

  it('--count 0 termina com erro claro e código diferente de zero', () =>
    withTempDir(async (dir) => {
      const result = runPostRandom(['--out', dir, '--count', '0']);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('--count deve ser um inteiro positivo');
      expect(await markdownFiles(dir)).toEqual([]);
    }));

  it('--date fora do formato termina com erro claro e código diferente de zero', () =>
    withTempDir(async (dir) => {
      const result = runPostRandom(['--out', dir, '--date', '2026-13-40']);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('--date deve ser uma data ISO válida (YYYY-MM-DD)');
      expect(await markdownFiles(dir)).toEqual([]);
    }));

  it('--tag repetível e --prefix geram slugs notas- com as Tags pedidas', () =>
    withTempDir(async (dir) => {
      const result = runPostRandom([
        '--out',
        dir,
        '--count',
        '3',
        '--seed',
        '45',
        '--date',
        fixedDate,
        '--tag',
        'testes',
        '--tag',
        'docker',
        '--prefix',
        'Notas:',
      ]);
      expect(result.status).toBe(0);

      const names = await markdownFiles(dir);
      expect(names).toHaveLength(3);
      for (const name of names) {
        expect(name).toMatch(/^notas-/);
        const post = parsePost(await readFile(join(dir, name), 'utf8'));
        expect(post.title).toMatch(/^Notas:\s/);
        expect(post.slug).toBe(name.replace(/\.md$/, ''));
        expect(post.tags).toContain('testes');
        expect(post.tags).toContain('docker');
      }
    }));

  it('--tag inválido termina com erro claro e não grava Fontes', () =>
    withTempDir(async (dir) => {
      const result = runPostRandom(['--out', dir, '--tag', 'inexistente']);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Tag inválida: 'inexistente'");
      expect(await markdownFiles(dir)).toEqual([]);
    }));

  it('--help documenta --tag e --prefix', () => {
    const result = runPostRandom(['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('--tag <tag>');
    expect(result.stdout).toContain('--prefix <texto>');
    expect(result.stdout).toContain('data atual em UTC');
    expect(result.stdout).toContain('com a mesma seed e --date a saída é idêntica');
    expect(result.stdout).not.toContain('com a mesma seed a saída é idêntica');
  });

  it('sem --date, a CLI usa a data atual em UTC', () =>
    withTempDir(async (dir) => {
      vi.useFakeTimers();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        vi.setSystemTime(new Date('2026-11-23T23:59:59.000Z'));
        await runCli(['--out', dir, '--count', '1', '--seed', '7']);
      } finally {
        log.mockRestore();
        vi.useRealTimers();
      }

      const names = await markdownFiles(dir);
      expect(names).toHaveLength(1);
      expect(parsePost(await readFile(join(dir, names[0]), 'utf8')).date).toBe('2026-11-23');
    }));
});
