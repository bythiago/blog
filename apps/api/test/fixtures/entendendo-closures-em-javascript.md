---
title: 'Entendendo closures em JavaScript'
date: '2025-12-20'
slug: 'entendendo-closures-em-javascript'
tags: ['javascript']
summary: 'Como uma função guarda o contexto em que foi criada e por que isso importa no dia a dia.'
---

# Entendendo closures em JavaScript

Uma closure é a capacidade de uma função lembrar das variáveis do escopo em que foi criada, mesmo depois desse escopo ter terminado. É um mecanismo simples que aparece em quase todo código moderno.

## Um exemplo concreto

Ao criar uma função dentro de outra, a função interna continua com acesso às variáveis da externa. Isso permite montar contadores, fábricas de funções e configurações parciais sem recorrer a variáveis globais.

## Cuidados

Closures não copiam valores: elas guardam referências. Em laços, isso pode surpreender quem espera uma cópia de cada iteração. Entender esse detalhe evita bugs difíceis de reproduzir.
