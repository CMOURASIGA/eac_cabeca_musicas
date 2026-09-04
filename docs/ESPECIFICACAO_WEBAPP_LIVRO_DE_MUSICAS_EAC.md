# Livro de Músicas EAC - Especificação funcional e técnica

## Visão do produto
Criar um WebApp público, responsivo e instalável como PWA para consulta e uso prático das músicas ligadas ao EAC. A experiência de leitura de cifra deve aproveitar conceitos já conhecidos em aplicações como o Cifra Club, mas o produto e sua organização serão próprios do EAC.

A leitura não exige login. Administração e publicação exigem autenticação.

## Separação obrigatória do conteúdo
O sistema terá dois contextos independentes para evitar confusão:

1. Livro de Músicas EAC / Cabeça
2. Músicas de Missa

Músicas de missa nunca devem aparecer misturadas ao catálogo Cabeça/EAC. O módulo de missa terá categorias litúrgicas configuráveis, por exemplo Entrada, Ato Penitencial, Glória, Salmo, Aclamação, Ofertório, Santo, Cordeiro, Comunhão, Pós-Comunhão, Final, Adoração, Maria e Espírito Santo.

## Catálogo inicial
A carga inicial corresponde às 41 músicas numeradas no PDF `Meu Canto, Minha Fé - Banda EAC Porciúncula`. O PDF também contém um apêndice de diagramas de acordes. Cada música deve virar um registro independente.

Os TXT derivados do PDF são material-fonte. Não corrigir automaticamente letra, cifra, ortografia ou tom durante a extração. A revisão editorial deve ocorrer antes da publicação.

## Home pública
A página inicial deve oferecer:

- entrada clara para Livro EAC e Músicas de Missa;
- busca por título e trecho da letra;
- músicas recentes;
- favoritos locais;
- repertórios públicos em destaque;
- acesso à seleção de músicas para PDF;
- convite de instalação PWA quando suportado.

## Tela da música
A tela individual é o núcleo do produto e deve conter:

- título e tom atual;
- transposição de tom para cima e para baixo;
- restaurar tom original;
- aumentar e reduzir fonte;
- modo claro e escuro;
- rolagem automática com velocidade ajustável e pausa;
- modo tela cheia;
- manter tela acordada quando a API do navegador permitir;
- favoritar;
- adicionar à seleção/repertório;
- gerar PDF individual;
- compartilhar link;
- diagramas apenas dos acordes usados;
- versão/data de atualização.

### Destaque visual das cifras
As cifras devem obrigatoriamente ficar em negrito e com cor diferente da letra, mantendo contraste acessível. O renderizador deve preservar o posicionamento cifra/letra e impedir que o layout mobile gere overflow horizontal desnecessário.

## Motor de transposição
A transposição deve atuar somente sobre tokens reconhecidos como acordes. A letra nunca pode ser alterada.

Cobrir notas naturais, sustenidos, bemóis, menores, sétimas, maiores, diminutos, suspensos, inversões e extensões. Exemplos esperados: `G -> A`, `Em -> F#m`, `D/F# -> E/G#`, `C7M -> D7M`.

A alteração feita pelo visitante vale para a visualização/repertório dele. Somente editor/admin pode alterar o tom-base publicado.

## TXT como formato editorial
Arquivos devem ser UTF-8 e preservar linhas em branco e espaçamento necessário ao alinhamento das cifras. Aceitar marcações como `[Verso]`, `[Refrão]`, `[Ponte]` e `[Pré-Refrão]`.

Para novos arquivos, suportar opcionalmente front matter:

```txt
---
title: SOMOS LUZ
collection: EAC
key: A
number: 41
---

[Verso 1]
A
Caminhando lado a lado
E
Sempre unidos
```

O importador também deve aceitar os 41 TXT legados sem front matter.

## Importação TXT
O painel administrativo deve permitir upload de um ou vários TXT, drag and drop, preview, detecção de título/tom/acordes, indicação de duplicidade, escolha da coleção/categoria e publicação ou rascunho.

Antes de publicar, mostrar as linhas interpretadas como cifra e sinalizar conteúdo ambíguo. Nunca sobrescrever silenciosamente uma música publicada.

## Google Drive
A pasta compartilhada será uma origem editorial dos TXT, não o banco de leitura do público.

Fluxo:

1. responsável salva TXT na pasta configurada;
2. painel executa `Verificar atualizações`;
3. backend consulta a pasta via Google Drive API;
4. compara id, nome, data e hash;
5. apresenta arquivos novos/alterados;
6. responsável seleciona o que importar;
7. sistema valida e mostra preview;
8. responsável publica;
9. WebApp serve a versão publicada pela própria base.

Manter upload manual como fallback.

Variáveis sugeridas: `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`. Segredos nunca podem chegar ao frontend ou ao repositório.

## Repertórios e seleção
Qualquer visitante poderá montar uma seleção temporária. Editor/admin poderá persistir repertórios oficiais, por exemplo EAC 37, Ensaio EAC 37, Pós-EAC e Missa de Domingo.

Permitir nome, descrição, data opcional, ordenação drag and drop, remoção, tom específico por música, duplicação e geração de PDF.

## PDF
PDF é requisito de primeira classe. Gerar por música, seleção temporária ou repertório salvo.

Para um encontro, o responsável escolhe e ordena as músicas e gera um livro fechado para compartilhar ou imprimir. O PDF completo deve suportar capa EAC, nome do encontro, data opcional, índice, músicas na ordem definida, cifras destacadas, tom selecionado, numeração, rodapé de identificação e diagramas dos acordes usados quando habilitados.

Opções antes da geração: incluir/excluir cifras, diagramas, observações, capa e escolher tamanho de fonte. Saída A4. Evitar separar uma linha de cifra da linha de letra correspondente.

## Diagramas
O apêndice estático do PDF de origem deve evoluir para um catálogo de shapes de acordes. A música exibe apenas os acordes utilizados e informa quando não existir diagrama cadastrado.

## Pesquisa e preferências
Busca deve ignorar caixa e acentos e pesquisar título, trecho da letra, número, categoria e tags.

Sem login público obrigatório, persistir localmente favoritos, tema, fonte, velocidade de rolagem e última música.

## PWA e offline
Implementar manifest, ícones, service worker e instalação em plataformas suportadas. Permitir cache do shell e músicas marcadas para offline. Conteúdo offline deve indicar quando estiver desatualizado e sincronizar ao recuperar conexão.

## Responsividade
Mobile first. Validar celular pequeno/grande, tablet, notebook e desktop. No mobile, usar controles adequados a toque e barra de ações compacta. A cifra não pode quebrar a experiência horizontal da página.

## Perfis administrativos
Leitura pública sem login.

- Administrador: usuários, configurações, categorias, integrações, publicação, arquivamento e auditoria.
- Editor: importar/revisar TXT, editar metadados, revisar parsing e criar repertórios conforme permissão.

## Modelo de dados sugerido

### songs
`id`, `number`, `title`, `slug`, `collection(EAC|MISSA)`, `category_id`, `original_key`, `source_text`, `normalized_text`, `status`, `source_type(MANUAL|DRIVE)`, `source_file_name`, `source_file_id`, `source_hash`, `published_at`, `updated_at`.

### song_categories
`id`, `collection`, `name`, `slug`, `sort_order`, `active`.

### repertoires
`id`, `name`, `description`, `collection`, `event_date`, `status`, `created_by`, `created_at`.

### repertoire_songs
`repertoire_id`, `song_id`, `sort_order`, `target_key`, `notes`.

### chord_diagrams
`id`, `chord_key`, `instrument`, `shape_json`, `active`.

### import_jobs / import_items
Registrar origem, arquivo, hash, resultado de parsing, validação e status para rastreabilidade.

## Arquitetura sugerida
- Next.js + TypeScript;
- Supabase para Postgres, autenticação administrativa e storage;
- geração de PDF server-side;
- PWA;
- parser/transpositor isolado e coberto por testes.

Separar módulos de conteúdo, parser, transposição, persistência, Drive, PDF e UI.

## Segurança
Consulta pública apenas de registros publicados. Painel autenticado, RLS onde aplicável, segredos somente server-side, sanitização de TXT, proibição de interpretar HTML/JS do TXT, limites de arquivo e auditoria de publicação/alteração/exclusão.

## Direitos e governança de conteúdo
A finalidade é facilitar o acesso ao repertório e à prática musical do EAC, não funcionar como catálogo comercial. Ainda assim, prever campos de autor/intérprete/origem, possibilidade de despublicação e aviso institucional. Não incorporar áudio comercial sem autorização.

## Critérios de aceite do MVP
1. catálogo publicado acessível sem login;
2. EAC e Missa separados visual e logicamente;
3. 41 músicas iniciais importáveis por TXT;
4. letra e cifra legíveis no mobile;
5. cifras em negrito e cor distinta;
6. transposição sem alterar letra;
7. fonte ajustável;
8. rolagem automática;
9. seleção de músicas;
10. seleção gera PDF diagramado;
11. editor importa novo TXT;
12. atualização não sobrescreve versão publicada sem revisão;
13. PWA instalável;
14. experiência validada em mobile, tablet e desktop.

## Fases
### Fase 1 - Base e leitura
Banco, catálogo público, parser TXT, importação manual, tela de música, transposição e responsividade.

### Fase 2 - Repertório e PDF
Seleção, repertórios, ordenação, PDF e diagramas.

### Fase 3 - Drive e PWA
Integração Drive, comparação de versões, PWA e offline.

### Fase 4 - Missa
Categorias litúrgicas, catálogo específico, filtros e repertórios de missa.

## Regra para a carga inicial
Preservar o conteúdo das 41 músicas conforme o PDF recebido. Os TXT são fonte para revisão humana, não uma autorização para o sistema inventar correções.