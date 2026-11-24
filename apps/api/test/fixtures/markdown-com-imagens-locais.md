---
title: 'Markdown com imagens locais'
date: '2026-03-05'
slug: 'markdown-com-imagens-locais'
tags: ['markdown']
summary: 'Como manter imagens ao lado dos Posts e referenciá-las sem depender de serviços externos.'
image: '/content/images/capa-markdown.svg'
---

# Markdown com imagens locais

Imagens versionadas junto com a Fonte tornam o Post reproduzível: não existe link externo para expirar.

![Capa do Post sobre Markdown](/content/images/capa-markdown.svg)

## Estrutura sugerida

```text
content/
  images/
    capa-markdown.svg
  markdown-com-imagens-locais.md
```

O campo `image` do frontmatter guarda a capa usada em listagens e redes sociais. O Corpo do Post pode trazer outras imagens com a sintaxe usual do Markdown.

## Boas práticas

- use nomes de arquivo descritivos;
- prefira formatos comprimidos;
- mantenha texto alternativo em todas as imagens.
