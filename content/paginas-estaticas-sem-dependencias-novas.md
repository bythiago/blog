---
title: 'Páginas estáticas sem dependências novas'
date: '2026-11-23'
slug: 'paginas-estaticas-sem-dependencias-novas'
tags: ['testes']
summary: 'Páginas estáticas sem dependências novas. Um guia curto, com código e decisões que mantêm o projeto simples.'
---

# Páginas estáticas sem dependências novas

Este Post registra uma forma direta de usar páginas estáticas no dia a dia. Sem promessa de solução universal, apenas o que ajuda a manter o trabalho previsível.

## Armadilhas comuns

O erro mais comum com páginas estáticas é resolver tudo de uma vez. Prefira uma mudança pequena, verifique o efeito e só então amplie o escopo.

O exemplo abaixo é pequeno o bastante para copiar e adaptar:

```js
import { createServer } from 'node:http';

const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('ok');
});

server.listen(3000);
```

Repare que páginas estáticas aparece como uma decisão explícita, não como um detalhe escondido.

## Primeiro passo

Defina uma fronteira clara para páginas estáticas no projeto. Uma decisão simples, tomada cedo, evita regras espalhadas e facilita revisar o resultado depois.

- verifique o resultado com os comandos do projeto;
- registre a decisão para o próximo Leitor;
- mantenha a Fonte atualizada quando o código mudar.
