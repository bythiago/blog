---
title: 'Testes de integração com supertest'
date: '2025-10-14'
slug: 'testes-de-integracao-com-supertest'
tags: ['javascript', 'testes']
summary: 'Exercite rotas HTTP reais sem abrir portas, mantendo a suíte rápida e confiável.'
---

# Testes de integração com supertest

Uma suíte de integração deve atravessar as camadas reais da aplicação. Com supertest é possível enviar requisições para o aplicativo Express diretamente, sem subir um servidor separado.

## O que verificar

Comece pelo status e pelo formato do corpo. Depois confirme os dados devolvidos e os efeitos colaterais esperados. Asserções pequenas e específicas falham com mensagens mais úteis.

## Isolamento

Cada teste deve montar seu próprio índice e seu próprio estado. Isso evita que a ordem de execução altere o resultado.
