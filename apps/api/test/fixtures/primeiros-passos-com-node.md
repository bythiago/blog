---
title: 'Primeiros passos com Node.js'
date: '2026-01-15'
slug: 'primeiros-passos-com-node'
tags: ['node', 'typescript', 'javascript']
summary: 'Como estruturar um pequeno serviço HTTP em Node.js com TypeScript e manter o código previsível.'
---

# Primeiros passos com Node.js

Node.js permite escrever serviços HTTP com poucas linhas. A parte difícil não é subir o servidor, e sim manter o projeto legível conforme ele cresce.

## Um servidor mínimo

```js
import { createServer } from 'node:http';

const server = createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ status: 'ok' }));
});

server.listen(3000);
```

O exemplo responde `{"status":"ok"}` em qualquer rota. Em um projeto real, vale separar a configuração das rotas e validar as variáveis de ambiente antes de abrir a porta.

## Próximos passos

- tipar as fronteiras do aplicativo;
- centralizar o tratamento de erros;
- escrever testes de integração desde cedo.
