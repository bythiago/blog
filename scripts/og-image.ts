import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { escapeXml, loadSiteConfig } from './site';

const OUTPUT_DIR = resolve(process.cwd(), 'dist', 'prerender');
const WIDTH = 1200;
const HEIGHT = 630;

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function buildSvg(title: string, description: string, domain: string): string {
  const lines = wrap(description, 52)
    .map(
      (line, index) => `    <tspan x="96" dy="${index === 0 ? 0 : 52}">${escapeXml(line)}</tspan>`,
    )
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#fafafa"/>
  <rect x="0" y="0" width="14" height="${HEIGHT}" fill="#6366f1"/>
  <g font-family="DejaVu Sans, sans-serif">
    <text x="96" y="150" font-size="28" font-weight="bold" fill="#6366f1">NOTAS DO THIAGO</text>
    <text x="96" y="260" font-size="68" font-weight="bold" fill="#18181b">${escapeXml(title)}</text>
    <text x="96" y="360" font-size="32" fill="#52525b">
${lines}
    </text>
    <text x="96" y="566" font-size="24" fill="#71717a">${escapeXml(domain)}</text>
  </g>
</svg>
`;
}

async function main(): Promise<void> {
  const config = loadSiteConfig();
  const svg = Buffer.from(buildSvg(config.title, config.description, new URL(config.baseUrl).host));

  await mkdir(OUTPUT_DIR, { recursive: true });
  await sharp(svg).png().toFile(join(OUTPUT_DIR, 'og-image.png'));

  console.log(`OG image gerada: ${WIDTH}x${HEIGHT} em ${join(OUTPUT_DIR, 'og-image.png')}`);
}

void main().catch((error: unknown) => {
  console.error('Falha ao gerar a OG image:', error);
  process.exitCode = 1;
});
