---
title: 'Markdown sem mistério'
date: '2026-11-23'
slug: 'markdown-sem-misterio'
tags: ['frontend', 'typescript']
summary: 'Notas sobre Markdown sem mistério, com um exemplo pequeno e os pontos que merecem atenção antes de seguir em frente.'
---

# Markdown sem mistério

Trabalhar com Markdown parece simples até o projeto crescer. Aqui o caminho é curto: uma decisão por vez, com código para conferir cada passo.

## Próximos passos

Com Markdown funcionando, registre a decisão na Fonte e mantenha o exemplo alinhado ao código. O próximo Leitor agradece o contexto.

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

## Armadilhas comuns

O erro mais comum com Markdown é resolver tudo de uma vez. Prefira uma mudança pequena, verifique o efeito e só então amplie o escopo.

- verifique o resultado com os comandos do projeto;
- registre a decisão para o próximo Leitor;
- mantenha a Fonte atualizada quando o código mudar.
