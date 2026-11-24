import { z } from 'zod';

const isoDateSchema = z
  .string()
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'date deve estar no formato ISO 8601 (YYYY-MM-DD)',
  })
  .refine(
    (value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    },
    { message: 'date deve ser uma data válida' },
  );

const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug deve usar letras minúsculas, números e hífens, sem espaços ou acentos',
  });

export const frontmatterSchema = z.object({
  title: z.string().trim().min(1, 'title é obrigatório'),
  date: isoDateSchema,
  tags: z.array(z.string().trim().min(1)),
  summary: z.string().trim().min(1, 'summary é obrigatório'),
  slug: slugSchema,
  image: z.string().trim().min(1).optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export { isoDateSchema, slugSchema };
