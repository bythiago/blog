---
title: 'Tipando respostas de API'
date: '2025-08-11'
slug: 'tipando-respostas-de-api'
tags: ['javascript']
summary: 'Tipos nas fronteiras ajudam a detectar mudanças de contrato antes do cliente.'
---

# Tipando respostas de API

A fronteira entre o servidor e o cliente é um bom lugar para exigir tipos explícitos. Uma resposta paginada, por exemplo, deve deixar claro quais campos sempre existem.

## Contratos estáveis

Quando o formato da resposta muda, o tipo muda junto. Isso transforma uma surpresa em produção em um erro de compilação no desenvolvimento.

## Paginação

Uma página traz itens, número da página, total de páginas e total de registros. Manter esses quatro campos juntos evita que cada tela interprete o resultado de um jeito diferente.
