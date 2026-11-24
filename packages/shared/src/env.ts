import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce
    .number({ invalid_type_error: 'PORT deve ser um número' })
    .int('PORT deve ser um número inteiro')
    .min(1, 'PORT deve ser maior que zero')
    .max(65535, 'PORT deve ser menor que 65536'),
  NODE_ENV: z.enum(['development', 'production', 'test'], {
    errorMap: () => ({ message: 'NODE_ENV deve ser development, production ou test' }),
  }),
  SITE_URL: z.string().url('SITE_URL deve ser uma URL válida'),
  SITE_TITLE: z.string().trim().min(1, 'SITE_TITLE é obrigatório e não pode ser vazio'),
  SITE_DESCRIPTION: z.string().trim().min(1, 'SITE_DESCRIPTION é obrigatório e não pode ser vazio'),
  DOMAIN: z.string().trim().min(1, 'DOMAIN é obrigatório e não pode ser vazio'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuração de ambiente inválida (validação zod):\n${details}`);
  }

  return result.data;
}
