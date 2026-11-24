---
title: 'Tipos compartilhados em projetos pequenos'
date: '2026-11-23'
slug: 'tipos-compartilhados-em-projetos-pequenos'
tags: ['node', 'typescript']
summary: 'Como encarar Tipos compartilhados em projetos pequenos sem complicar a manutenção. Uma Fonte prática, direta e fácil de revisar.'
---

# Tipos compartilhados em projetos pequenos

Trabalhar com tipos compartilhados parece simples até o projeto crescer. Aqui o caminho é curto: uma decisão por vez, com código para conferir cada passo.

## Primeiro passo

Defina uma fronteira clara para tipos compartilhados no projeto. Uma decisão simples, tomada cedo, evita regras espalhadas e facilita revisar o resultado depois.

O exemplo abaixo é pequeno o bastante para copiar e adaptar:

```ts
type Resultado = { ok: true; valor: number } | { ok: false; erro: string };

function dividir(a: number, b: number): Resultado {
  if (b === 0) return { ok: false, erro: "divisao por zero" };
  return { ok: true, valor: a / b };
}
```

Repare que tipos compartilhados aparece como uma decisão explícita, não como um detalhe escondido.

## Próximos passos

Com tipos compartilhados funcionando, registre a decisão na Fonte e mantenha o exemplo alinhado ao código. O próximo Leitor agradece o contexto.

- verifique o resultado com os comandos do projeto;
- registre a decisão para o próximo Leitor;
- mantenha a Fonte atualizada quando o código mudar.
