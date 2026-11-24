---
title: 'Módulos ESM em Node.js'
date: '2025-07-07'
slug: 'modulos-esm-em-node'
tags: ['javascript']
summary: 'Entenda import, export e as extensões exigidas pelo carregador de módulos.'
---

# Módulos ESM em Node.js

O formato ESM usa import e export para ligar arquivos. No Node.js, os caminhos relativos normalmente precisam da extensão do arquivo, mesmo quando o código foi escrito em TypeScript.

## Extensões e compilação

Depois da compilação, os imports apontam para arquivos JavaScript. Manter a extensão no código-fonte evita falhas que só aparecem ao executar o resultado compilado.

## Interoperabilidade

Nem toda dependência oferece uma versão ESM. Conhecer as opções de interoperabilidade ajuda a integrar pacotes antigos sem abandonar o formato novo.
