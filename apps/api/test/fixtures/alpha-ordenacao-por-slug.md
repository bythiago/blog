---
title: 'Ordenação por slug: exemplo alpha'
date: '2025-04-01'
slug: 'alpha-ordenacao-por-slug'
tags: ['javascript']
summary: 'Quando duas Fontes têm a mesma data, o slug decide a ordem na listagem.'
---

# Ordenação por slug: exemplo alpha

Esta Fonte compartilha a data com outra para exercitar o desempate da listagem. A ordem final é determinada pelo slug, em comparação alfabética.

## Por que desempatar

Sem um critério estável, páginações diferentes podem devolver o mesmo item em posições diferentes. Um desempate previsível torna a API determinística.

## Critério usado

Primeiro a data, do mais recente para o mais antigo. Em seguida o slug, em ordem alfabética. Aqui o resultado é alpha.
