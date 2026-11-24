---
title: 'Tipos compartilhados sem dependências novas'
date: '2026-11-23'
slug: 'tipos-compartilhados-sem-dependencias-novas'
tags: ['docker', 'testes', 'frontend']
summary: 'Tipos compartilhados sem dependências novas. Um guia curto, com código e decisões que mantêm o projeto simples.'
---

# Tipos compartilhados sem dependências novas

Este Post registra uma forma direta de usar tipos compartilhados no dia a dia. Sem promessa de solução universal, apenas o que ajuda a manter o trabalho previsível.

## Próximos passos

Com tipos compartilhados funcionando, registre a decisão na Fonte e mantenha o exemplo alinhado ao código. O próximo Leitor agradece o contexto.

O exemplo abaixo é pequeno o bastante para copiar e adaptar:

```ts
type Resultado = { ok: true; valor: number } | { ok: false; erro: string };

function dividir(a: number, b: number): Resultado {
  if (b === 0) return { ok: false, erro: "divisao por zero" };
  return { ok: true, valor: a / b };
}
```

Repare que tipos compartilhados aparece como uma decisão explícita, não como um detalhe escondido.

## Primeiro passo

Defina uma fronteira clara para tipos compartilhados no projeto. Uma decisão simples, tomada cedo, evita regras espalhadas e facilita revisar o resultado depois.

- verifique o resultado com os comandos do projeto;
- registre a decisão para o próximo Leitor;
- mantenha a Fonte atualizada quando o código mudar.
