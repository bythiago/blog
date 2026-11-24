import { parseEnv, type Env } from '@blog/shared';

/** Configuração validada no boot (schema zod compartilhado). */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Env {
  return parseEnv(env as Record<string, string | undefined>);
}
