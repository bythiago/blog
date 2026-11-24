---
title: 'Validando dados com Zod'
date: '2026-02-10'
slug: 'validando-dados-com-zod'
tags: ['typescript', 'zod', 'javascript']
summary: 'Use schemas para transformar dados incertos em tipos confiáveis no limite do seu aplicativo.'
---

# Validando dados com Zod

Zod resolve um problema comum: confiar em dados que vêm de fora. Em vez de espalhar verificações pelo código, descreva o formato esperado uma vez.

## Um schema pequeno

```ts
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

type Post = z.infer<typeof postSchema>;

const post = postSchema.parse({ title: 'Notas', tags: ['node'] });
```

O método `parse` lança um erro detalhado quando o valor não corresponde ao schema. Já `safeParse` devolve um resultado que pode ser inspecionado sem exceções.

## Onde validar

Valide na fronteira: ao ler arquivos, ao receber requisições e ao carregar variáveis de ambiente. Depois disso, o restante do código trabalha com tipos já conhecidos.
