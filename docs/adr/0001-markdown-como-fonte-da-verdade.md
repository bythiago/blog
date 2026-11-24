# Markdown versionado como fonte da verdade

As Fontes dos Posts são arquivos Markdown com frontmatter mantidos no próprio repositório, e a Publicação acontece por commit/PR, em vez de CMS ou banco de dados. Isso mantém o conteúdo revisável junto com o código e evita um painel administrativo, ao custo de exigir Git para escrever e de não permitir edição em runtime.

**Considered Options**: CMS headless; banco de dados com painel admin; Markdown versionado (escolhido). As duas primeiras foram descartadas porque o blog tem autor único e o custo de manter uma interface de edição não se justifica.

**Consequences**: publicar um Post passa a depender do fluxo de build e deploy descrito em [ADR 0003](./0003-conteudo-embutido-na-imagem.md).
