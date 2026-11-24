import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parsePost, slugify } from '@blog/shared';

/** Tags fixas e documentadas que o gerador pode atribuir às Fontes. */
export const RANDOM_POST_TAGS = [
  'node',
  'typescript',
  'markdown',
  'testes',
  'docker',
  'frontend',
  'performance',
] as const;

export type RandomPostTag = (typeof RANDOM_POST_TAGS)[number];

/** Normaliza, deduplica e valida as Tags pedidas contra o conjunto fixo. */
export function validateRandomPostTags(tags: readonly string[]): RandomPostTag[] {
  const normalized = [...new Set(tags.map((tag) => tag.trim()))];
  const invalid = normalized.find((tag) => !(RANDOM_POST_TAGS as readonly string[]).includes(tag));
  if (invalid !== undefined) {
    throw new RangeError(
      `Tag inválida: '${invalid}'. Tags válidas: ${RANDOM_POST_TAGS.join(', ')}`,
    );
  }
  return normalized as RandomPostTag[];
}

/** Pequeno gerador determinístico (mulberry32): a mesma seed produz a mesma sequência. */
export interface SeededRandom {
  /** Inteiro de 0 (inclusive) até maxExclusive (exclusivo). */
  nextInt(maxExclusive: number): number;
  /** Um item de uma lista não vazia. */
  pick<T>(items: readonly T[]): T;
}

export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (maxExclusive: number): number => {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError('maxExclusive deve ser um inteiro positivo');
    }
    return Math.floor(next() * maxExclusive);
  };

  return {
    nextInt,
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('Não é possível escolher de uma lista vazia');
      return items[nextInt(items.length)];
    },
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Data atual em UTC, usada quando nem a CLI nem o chamador informam `--date`. */
function currentUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickDistinct<T>(items: readonly T[], count: number, random: SeededRandom): T[] {
  const available = [...items];
  const chosen: T[] = [];
  while (chosen.length < count && available.length > 0) {
    chosen.push(available.splice(random.nextInt(available.length), 1)[0]);
  }
  return chosen;
}

const TEMAS = [
  'Node.js',
  'TypeScript',
  'Markdown',
  'Docker',
  'testes automatizados',
  'páginas estáticas',
  'variáveis de ambiente',
  'busca local',
  'builds reproduzíveis',
  'tipos compartilhados',
  'scripts de build',
  'configuração do ESLint',
  'formulários React',
  'rotas da API',
  'cache de imagens',
  'frontmatter',
  'índices de busca',
  'pré-renderização',
  'Git hooks',
  'GitHub Actions',
  'Fontes versionadas',
  'imagens OG',
  'monorepos npm',
  'padrões de erro',
] as const;

const ANGULOS = [
  'na prática',
  'sem mistério',
  'em projetos pequenos',
  'com exemplos',
  'do zero',
  'com calma',
  'no dia a dia',
  'sem dependências novas',
  'e seus limites',
  'passo a passo',
  'em poucas linhas',
  'com testes',
  'antes de publicar',
  'para quem começa',
  'depois da Publicação',
  'sem configuração extra',
  'com menos código',
  'em produção',
  'revisando decisões',
  'quando o projeto cresce',
] as const;

/** Recortes finais que, somados aos ângulos, ampliam o conjunto de títulos. */
const SUFIXOS = [
  '',
  'notas curtas',
  'checklist',
  'lições aprendidas',
  'exemplos mínimos',
  'armadilhas comuns',
  'limites claros',
  'um exemplo real',
  'decisões registradas',
  'revisão rápida',
  'versão curta',
  'com contexto',
] as const;

const INTROS = [
  (tema: string) =>
    `Trabalhar com ${tema} parece simples até o projeto crescer. Aqui o caminho é curto: uma decisão por vez, com código para conferir cada passo.`,
  (tema: string) =>
    `Este Post registra uma forma direta de usar ${tema} no dia a dia. Sem promessa de solução universal, apenas o que ajuda a manter o trabalho previsível.`,
  (tema: string) =>
    `Há várias maneiras de abordar ${tema}. Esta Fonte escolhe a mais simples que ainda resolve o problema e explica onde ela deixa de servir.`,
] as const;

const RESUMOS = [
  (tema: string, angulo: string) =>
    `${tema} ${angulo}. Um guia curto, com código e decisões que mantêm o projeto simples.`,
  (tema: string, angulo: string) =>
    `Notas sobre ${tema} ${angulo}, com um exemplo pequeno e os pontos que merecem atenção antes de seguir em frente.`,
  (tema: string, angulo: string) =>
    `Como encarar ${tema} ${angulo} sem complicar a manutenção. Uma Fonte prática, direta e fácil de revisar.`,
] as const;

const SECOES = [
  {
    titulo: 'Primeiro passo',
    paragrafo: (tema: string) =>
      `Defina uma fronteira clara para ${tema} no projeto. Uma decisão simples, tomada cedo, evita regras espalhadas e facilita revisar o resultado depois.`,
  },
  {
    titulo: 'O que observar',
    paragrafo: (tema: string) =>
      `Depois de colocar ${tema} em uso, observe onde o código fica mais legível e onde ele começa a repetir. Essa diferença costuma indicar o próximo ajuste.`,
  },
  {
    titulo: 'Armadilhas comuns',
    paragrafo: (tema: string) =>
      `O erro mais comum com ${tema} é resolver tudo de uma vez. Prefira uma mudança pequena, verifique o efeito e só então amplie o escopo.`,
  },
  {
    titulo: 'Próximos passos',
    paragrafo: (tema: string) =>
      `Com ${tema} funcionando, registre a decisão na Fonte e mantenha o exemplo alinhado ao código. O próximo Leitor agradece o contexto.`,
  },
] as const;

const EXEMPLOS = [
  {
    linguagem: 'ts',
    codigo: [
      'type Resultado = { ok: true; valor: number } | { ok: false; erro: string };',
      '',
      'function dividir(a: number, b: number): Resultado {',
      '  if (b === 0) return { ok: false, erro: "divisao por zero" };',
      '  return { ok: true, valor: a / b };',
      '}',
    ].join('\n'),
  },
  {
    linguagem: 'js',
    codigo: [
      "import { createServer } from 'node:http';",
      '',
      'const server = createServer((_request, response) => {',
      "  response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });",
      "  response.end('ok');",
      '});',
      '',
      'server.listen(3000);',
    ].join('\n'),
  },
  {
    linguagem: 'bash',
    codigo: ['npm run lint', 'npm run test', 'npm run build'].join('\n'),
  },
] as const;

export interface GenerateRandomPostOptions {
  /** Seed inteira: com os demais campos iguais, a mesma seed gera a mesma Fonte. */
  seed: number;
  /** Data ISO `YYYY-MM-DD`. Quando ausente, usa a data atual em UTC. */
  date?: string;
  /** Tags obrigatórias, validadas contra `RANDOM_POST_TAGS`; o restante é sorteado. */
  tags?: readonly string[];
  /** Texto aplicado ao início do título; a versão slugificada inicia o slug. */
  prefix?: string;
}

function buildBody(
  titulo: string,
  tema: string,
  intro: string,
  secoes: typeof SECOES,
  exemplo: (typeof EXEMPLOS)[number],
): string {
  const [primeira, segunda] = secoes;
  return [
    `# ${titulo}`,
    '',
    intro,
    '',
    `## ${primeira.titulo}`,
    '',
    primeira.paragrafo(tema),
    '',
    'O exemplo abaixo é pequeno o bastante para copiar e adaptar:',
    '',
    `\`\`\`${exemplo.linguagem}`,
    exemplo.codigo,
    '```',
    '',
    `Repare que ${tema} aparece como uma decisão explícita, não como um detalhe escondido.`,
    '',
    `## ${segunda.titulo}`,
    '',
    segunda.paragrafo(tema),
    '',
    '- verifique o resultado com os comandos do projeto;',
    '- registre a decisão para o próximo Leitor;',
    '- mantenha a Fonte atualizada quando o código mudar.',
    '',
  ].join('\n');
}

/**
 * Devolve o texto completo de uma Fonte (frontmatter + Corpo), sem efeitos colaterais.
 * Toda aleatoriedade vem da seed; `image` nunca é emitido para não apontar para arquivo ausente.
 */
export function generateRandomPost(options: GenerateRandomPostOptions): string {
  const { seed, date, prefix } = options;
  if (!Number.isInteger(seed)) throw new RangeError('seed deve ser um número inteiro');
  if (date !== undefined && !isValidIsoDate(date)) {
    throw new RangeError('date deve ser uma data ISO válida (YYYY-MM-DD)');
  }

  const requestedTags = validateRandomPostTags(options.tags ?? []);
  if (prefix !== undefined && slugify(prefix) === '') {
    throw new RangeError('prefix deve conter ao menos um caractere alfanumérico');
  }
  const prefixText = prefix?.trim() ?? '';

  const random = createSeededRandom(seed);
  const postDate = date ?? currentUtcDate();
  const tema = random.pick(TEMAS);
  const angulo = random.pick(ANGULOS);
  const sufixo = random.pick(SUFIXOS);
  const tituloBase = `${capitalize(tema)} ${angulo}${sufixo ? ` — ${sufixo}` : ''}`;
  const titulo = prefixText ? `${prefixText} ${tituloBase}` : tituloBase;
  const slug = slugify(titulo);
  const quantidadeTags = 1 + random.nextInt(3);
  const tagsSorteadas = pickDistinct(
    RANDOM_POST_TAGS.filter((tag) => !requestedTags.includes(tag)),
    Math.max(0, quantidadeTags - requestedTags.length),
    random,
  );
  const tags = [...requestedTags, ...tagsSorteadas];
  const resumo = random.pick(RESUMOS)(capitalize(tema), angulo);
  const intro = random.pick(INTROS)(tema);
  const secoes = pickDistinct(SECOES, 2, random);
  const exemplo = random.pick(EXEMPLOS);

  return [
    '---',
    `title: '${titulo}'`,
    `date: '${postDate}'`,
    `slug: '${slug}'`,
    `tags: [${tags.map((tag) => `'${tag}'`).join(', ')}]`,
    `summary: '${resumo}'`,
    '---',
    '',
    buildBody(titulo, tema, intro, secoes, exemplo),
  ].join('\n');
}

export interface CliOptions {
  count: number;
  seed?: number;
  date?: string;
  tags: string[];
  prefix?: string;
  out: string;
  dryRun: boolean;
  help: boolean;
}

const USAGE = [
  'Uso: npm run post:random -- [opções]',
  '  --count <n>          quantidade de Fontes a gerar (padrão: 1)',
  '  --seed <n>           seed inteira; com a mesma seed e --date a saída é idêntica',
  '  --date YYYY-MM-DD    data do frontmatter (padrão: data atual em UTC)',
  `  --tag <tag>          Tag obrigatória; repita para várias (${RANDOM_POST_TAGS.join(', ')})`,
  '  --prefix <texto>     prefixo aplicado ao título e ao slug (sanitizado via slugify)',
  '  --out <dir>          diretório das Fontes (padrão: content/)',
  '  --dry-run            lista caminhos/slugs sem gravar arquivos',
  '  --help               mostra esta ajuda',
].join('\n');

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = { count: 1, tags: [], out: 'content', dryRun: false, help: false };

  const takeValue = (index: number, flag: string): { value: string; next: number } => {
    const argument = argv[index];
    if (argument.startsWith(`${flag}=`)) {
      const inline = argument.slice(flag.length + 1);
      if (!inline) throw new Error(`${flag} exige um valor`);
      return { value: inline, next: index + 1 };
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`${flag} exige um valor`);
    return { value, next: index + 2 };
  };

  for (let index = 0; index < argv.length;) {
    const flag = argv[index].split('=')[0];
    switch (flag) {
      case '--help':
      case '-h':
        options.help = true;
        index += 1;
        break;
      case '--dry-run':
        options.dryRun = true;
        index += 1;
        break;
      case '--count': {
        const { value, next } = takeValue(index, '--count');
        if (!/^\d+$/.test(value) || Number(value) < 1) {
          throw new Error('--count deve ser um inteiro positivo');
        }
        options.count = Number(value);
        index = next;
        break;
      }
      case '--seed': {
        const { value, next } = takeValue(index, '--seed');
        if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
          throw new Error('--seed deve ser um número inteiro');
        }
        options.seed = Number(value);
        index = next;
        break;
      }
      case '--date': {
        const { value, next } = takeValue(index, '--date');
        if (!isValidIsoDate(value))
          throw new Error('--date deve ser uma data ISO válida (YYYY-MM-DD)');
        options.date = value;
        index = next;
        break;
      }
      case '--tag': {
        const { value, next } = takeValue(index, '--tag');
        validateRandomPostTags([value]);
        if (!options.tags.includes(value.trim())) options.tags.push(value.trim());
        index = next;
        break;
      }
      case '--prefix': {
        const { value, next } = takeValue(index, '--prefix');
        if (slugify(value) === '') {
          throw new Error('--prefix deve conter ao menos um caractere alfanumérico');
        }
        options.prefix = value.trim();
        index = next;
        break;
      }
      case '--out': {
        const { value, next } = takeValue(index, '--out');
        options.out = value;
        index = next;
        break;
      }
      default:
        throw new Error(`Opção desconhecida: ${argv[index]}\n${USAGE}`);
    }
  }

  return options;
}

const MAX_SLUG_ATTEMPTS = 24;
const SEED_STEP = 0x9e3779b9;

async function collectExistingSlugs(directory: string): Promise<Set<string>> {
  if (!existsSync(directory)) return new Set();
  const entries = await readdir(directory, { withFileTypes: true });
  return new Set(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name.slice(0, -'.md'.length)),
  );
}

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(argv);
  if (options.help) {
    console.log(USAGE);
    return;
  }

  const outputDir = resolve(process.cwd(), options.out);
  const usedSlugs = await collectExistingSlugs(outputDir);
  const baseSeed = options.seed ?? Date.now();
  let generated = 0;

  for (let index = 0; index < options.count; index += 1) {
    let attemptSeed = (baseSeed + index) >>> 0;
    let source = generateRandomPost({
      seed: attemptSeed,
      date: options.date,
      tags: options.tags,
      prefix: options.prefix,
    });
    let slug = parsePost(source).slug;

    for (let attempt = 0; usedSlugs.has(slug) && attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      console.warn(`Aviso: slug '${slug}' já existe; re-sorteando a Fonte.`);
      attemptSeed = (attemptSeed + SEED_STEP) >>> 0;
      source = generateRandomPost({
        seed: attemptSeed,
        date: options.date,
        tags: options.tags,
        prefix: options.prefix,
      });
      slug = parsePost(source).slug;
    }

    if (usedSlugs.has(slug)) {
      console.warn(`Aviso: slug '${slug}' continua em uso; Fonte descartada.`);
      continue;
    }
    usedSlugs.add(slug);

    const file = `${slug}.md`;
    const displayPath = join(options.out, file);
    const tags = parsePost(source).tags;
    if (options.dryRun) {
      console.log(`[dry-run] ${displayPath} (slug: ${slug}) (tags: ${tags.join(', ')})`);
    } else {
      await mkdir(outputDir, { recursive: true });
      try {
        await writeFile(join(outputDir, file), source, { encoding: 'utf8', flag: 'wx' });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
          console.warn(`Aviso: ${displayPath} surgiu durante a geração; Fonte descartada.`);
          continue;
        }
        throw error;
      }
      console.log(`${displayPath} (slug: ${slug})`);
    }
    generated += 1;
  }

  const rotulo = options.dryRun ? 'Simuladas' : 'Geradas';
  console.log(`${rotulo} ${generated} Fonte(s). Gerar a Fonte não publica o Post (ADR 0003).`);
}

// Evita executar a CLI quando o módulo é importado pelos testes da issue irmã.
const invokedAsScript =
  typeof process.argv[1] === 'string' && /random-post\.(?:ts|js|cjs|mjs)$/.test(process.argv[1]);

if (invokedAsScript) {
  void runCli().catch((error: unknown) => {
    console.error('Falha ao gerar Fontes:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
