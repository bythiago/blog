import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { parsePost, type ParsedPost } from '@blog/shared';

const IMAGE_PREFIX = '/content/images/';

export interface ContentCheckIssue {
  /** Caminho da Fonte com problema. */
  file: string;
  /** Motivo legível da falha. */
  reason: string;
}

export interface ContentCheckResult {
  /** Quantidade de Fontes com frontmatter válido. */
  posts: number;
  /** Quantidade de Tags distintas entre as Fontes. */
  tags: number;
  /** Quantidade de Fontes cujo slug já havia aparecido em outra Fonte. */
  duplicates: number;
  /** Problemas encontrados, um por Fonte/motivo. */
  issues: ContentCheckIssue[];
}

function displayPath(file: string): string {
  const fromCwd = relative(process.cwd(), file);
  return fromCwd.startsWith('..') || fromCwd.startsWith('/') ? file : fromCwd;
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** Só aceita caminhos relativos simples, sem travessia de diretório. */
function safeRelativePath(value: string): string | null {
  const segments = value.split(/[\\/]/);
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return null;
  return segments.join('/');
}

function imageRelativePath(image: string): string | null {
  if (image.startsWith(IMAGE_PREFIX)) return safeRelativePath(image.slice(IMAGE_PREFIX.length));
  if (!/[\\/]/.test(image) && !image.startsWith('/')) return safeRelativePath(image);
  return null;
}

/** Valida todas as Fontes de `dir` sem gravar nada; lê `.md` da raiz do diretório. */
export async function checkContent(
  dir: string = resolve(process.cwd(), 'content'),
): Promise<ContentCheckResult> {
  const contentDir = resolve(dir);
  const issues: ContentCheckIssue[] = [];
  const tags = new Set<string>();
  const firstFileBySlug = new Map<string, string>();
  let posts = 0;
  let duplicates = 0;

  const entries = (await readdir(contentDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  for (const entry of entries) {
    const file = join(contentDir, entry.name);
    const path = displayPath(file);

    let post: ParsedPost;
    try {
      post = parsePost(await readFile(file, 'utf8'));
    } catch (error) {
      issues.push({
        file: path,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    posts += 1;
    for (const tag of post.tags) tags.add(tag);

    const expectedName = `${post.slug}.md`;
    if (entry.name !== expectedName) {
      issues.push({
        file: path,
        reason: `nome de arquivo '${entry.name}' diverge do slug '${post.slug}' (esperado '${expectedName}')`,
      });
    }

    const firstFile = firstFileBySlug.get(post.slug);
    if (firstFile === undefined) {
      firstFileBySlug.set(post.slug, path);
    } else {
      duplicates += 1;
      issues.push({
        file: path,
        reason: `slug '${post.slug}' duplicado: já usado em '${firstFile}'`,
      });
    }

    if (post.image !== undefined) {
      const imagePath = imageRelativePath(post.image);
      if (imagePath === null) {
        issues.push({
          file: path,
          reason: `image '${post.image}' deve apontar para um arquivo em /content/images/`,
        });
      } else if (!(await isFile(join(contentDir, 'images', imagePath)))) {
        issues.push({
          file: path,
          reason: `image '${post.image}' não encontrada em content/images/`,
        });
      }
    }
  }

  return { posts, tags: tags.size, duplicates, issues };
}

const USAGE = [
  'Uso: npm run content:check -- [opções]',
  '  --dir <dir>    diretório das Fontes (padrão: content/)',
  '  --help         mostra esta ajuda',
].join('\n');

export function parseCliArgs(argv: string[]): { dir: string; help: boolean } {
  let dir = 'content';
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      help = true;
    } else if (argument === '--dir' || argument.startsWith('--dir=')) {
      const value = argument.startsWith('--dir=') ? argument.slice('--dir='.length) : argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--dir exige um caminho');
      dir = value;
    } else {
      throw new Error(`Opção desconhecida: ${argument}\n${USAGE}`);
    }
  }

  return { dir, help };
}

/** Executa a validação e devolve o código de saída (0 quando não há problemas). */
export async function runCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const options = parseCliArgs(argv);
  if (options.help) {
    console.log(USAGE);
    return 0;
  }

  let result: ContentCheckResult;
  try {
    result = await checkContent(options.dir);
  } catch (error) {
    console.error(
      `Não foi possível validar as Fontes: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  }

  if (result.issues.length > 0) {
    for (const issue of result.issues) {
      console.error(`${issue.file}: ${issue.reason}`);
    }
    console.error(`${result.issues.length} problema(s) encontrado(s) nas Fontes.`);
    return 1;
  }

  const duplicates =
    result.duplicates === 0 ? 'nenhuma duplicata' : `${result.duplicates} duplicata(s)`;
  console.log(`OK: ${result.posts} Fonte(s), ${result.tags} Tag(s), ${duplicates} de slug.`);
  return 0;
}

const invokedAsScript =
  typeof process.argv[1] === 'string' && /content-check\.(?:ts|js|cjs|mjs)$/.test(process.argv[1]);

if (invokedAsScript) {
  void runCli()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      console.error(`Falha ao validar Fontes: ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    });
}
