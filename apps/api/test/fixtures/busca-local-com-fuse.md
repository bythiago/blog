---
title: 'Busca local com Fuse.js'
date: '2025-06-03'
slug: 'busca-local-com-fuse'
tags: ['javascript']
summary: 'Um índice único em memória resolve a busca sem uma request por tecla digitada.'
---

# Busca local com Fuse.js

Buscar no próprio navegador evita tráfego de rede e mantém a interface responsiva. Com um índice pequeno, o resultado aparece enquanto a pessoa digita.

## Um índice só

Construa o índice uma vez e reutilize-o. Recriar a estrutura a cada tecla desperdiça trabalho e pode causar travamentos perceptíveis.

## Texto limpo

Antes de indexar, remova marcações de formatação do corpo do texto. Isso melhora a relevância dos resultados e reduz o tamanho do índice.
