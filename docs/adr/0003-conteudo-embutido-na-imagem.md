# Conteúdo embutido na imagem de produção

As Fontes são copiadas para dentro da imagem Docker de produção, de modo que publicar um Post exige gerar e subir uma nova imagem, em vez de montar um volume read-only apontando para o host. Isso mantém cada deploy imutável e previsível; o custo é que editar texto não é instantâneo e o conteúdo não pode ser alterado diretamente no servidor.

**Considered Options**: volume read-only em produção; conteúdo embutido na imagem (escolhido). O volume foi descartado porque criaria divergência entre o que está no repositório e o que está no ar.

**Consequences**: no desenvolvimento, um bind mount continua existindo para recarregar alterações sem rebuild.
