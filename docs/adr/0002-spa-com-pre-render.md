# SPA com pré-render no build

A interface é uma SPA React servida pelo Express, com um HTML por rota gerado no build para que cada Post, Página e Página de listagem já chegue ao Leitor e aos crawlers com título, Resumo e Corpo presentes. Escolhemos isso em vez de SSR completo porque o conteúdo só muda quando um Post é publicado — o que já dispara um build —, evitando um servidor de renderização permanente.

**Considered Options**: SSR completo; SPA sem pré-render; SPA com pré-render no build (escolhido). A SPA sem pré-render foi descartada pelo custo de SEO; o SSR, pela complexidade adicional sem ganho para conteúdo raramente alterado.

**Consequences**: o HTML indexável é um artefato do build, então conteúdo novo exige rebuild — ver [ADR 0003](./0003-conteudo-embutido-na-imagem.md).
