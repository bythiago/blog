---
title: 'Markdown do zero'
date: '2026-11-23'
slug: 'markdown-do-zero'
tags: ['node']
summary: 'Markdown do zero. Um guia curto, com código e decisões que mantêm o projeto simples.'
---

# Markdown do zero

Trabalhar com Markdown parece simples até o projeto crescer. Aqui o caminho é curto: uma decisão por vez, com código para conferir cada passo.

## Armadilhas comuns

O erro mais comum com Markdown é resolver tudo de uma vez. Prefira uma mudança pequena, verifique o efeito e só então amplie o escopo.

O exemplo abaixo é pequeno o bastante para copiar e adaptar:

```js
import { createServer } from 'node:http';

const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('ok');
});

server.listen(3000);
```

Repare que Markdown aparece como uma decisão explícita, não como um detalhe escondido.

## O que observar

Depois de colocar Markdown em uso, observe onde o código fica mais legível e onde ele começa a repetir. Essa diferença costuma indicar o próximo ajuste.

- verifique o resultado com os comandos do projeto;
- registre a decisão para o próximo Leitor;
- mantenha a Fonte atualizada quando o código mudar.
