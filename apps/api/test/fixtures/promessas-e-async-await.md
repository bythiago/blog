---
title: 'Promessas e async/await'
date: '2025-11-18'
slug: 'promessas-e-async-await'
tags: ['javascript', 'testes']
summary: 'A sintaxe async/await é apenas uma forma mais legível de trabalhar com Promises.'
---

# Promessas e async/await

Promessas representam um valor que ainda vai chegar. A sintaxe async/await não cria outro modelo de execução: ela apenas deixa o código assíncrono mais parecido com código sequencial.

## Erros e espera

Um await dentro de um bloco try/catch captura rejeições da mesma forma que um catch de promise. Use Promise.all quando as tarefas são independentes e um laço quando precisar esperar uma por uma.

## Leitura

Escolha o estilo que torne o fluxo mais evidente para quem vai ler o código depois. Consistência vale mais que preferência pessoal.
