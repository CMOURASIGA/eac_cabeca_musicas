# Livro de Músicas EAC

Projeto do WebApp público `Meu Canto, Minha Fé`, pensado para facilitar o acesso às músicas utilizadas no contexto do EAC, com leitura de letras e cifras, transposição de tom, repertórios e geração de PDF.

## Direcionamento

- acesso público ao catálogo publicado;
- Livro EAC/Cabeça separado do módulo Músicas de Missa;
- importação de músicas por TXT;
- Google Drive como possível origem editorial dos TXT;
- cifras em negrito e cor distinta da letra;
- transposição de acordes na tela;
- seleção de músicas e geração de livro PDF diagramado para encontros;
- PWA responsiva para celular, tablet e notebook;
- painel administrativo protegido para importação, revisão e publicação.

## Conteúdo inicial

A carga inicial será formada pelas 41 músicas do PDF `Meu Canto, Minha Fé - Banda EAC Porciúncula`. Os TXT extraídos do documento devem preservar a fonte e passar por revisão editorial antes da publicação. Não corrigir automaticamente letra, cifra ou tom sem validação humana.

## Documentação

- [Especificação funcional e técnica](docs/ESPECIFICACAO_WEBAPP_LIVRO_DE_MUSICAS_EAC.md)

## Implementação

O desenvolvimento deve seguir os critérios de aceite e fases definidos na especificação. Mudanças de arquitetura ou de escopo devem ser documentadas antes da implementação.