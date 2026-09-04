# Integração com Google Drive — plano (ainda não implementada)

Por decisão explícita, esta integração só entra depois que a persistência
(Supabase) e a importação manual de TXT estiverem estáveis em produção.
Este documento existe para não perder o desenho da solução até lá, e para
deixar claro o requisito principal: **o `manifest.csv` é só auxiliar,
nunca a fonte da verdade** — novos `.txt` devem ser descobertos direto na
pasta do Drive, sem exigir que alguém atualize um manifesto manualmente.

## Por que não implementar ainda

- Reaproveita o pipeline de importação já pronto em `/admin/importar`
  (parser, preview, detecção de duplicidade, classificação, rascunho/
  publicação) — a única coisa que muda é a origem dos arquivos.
- Evita a complexidade extra de OAuth/Service Account do Google antes de o
  fluxo manual estar validado com os 41 TXT reais.

## Fluxo desenhado (da especificação)

1. Responsável salva `.txt` na pasta do Drive configurada.
2. No painel, botão **"Verificar atualizações"** (já reservado na
   navegação do admin, hoje sem ação).
3. Backend consulta a pasta via Google Drive API (`files.list`), listando
   **todos os arquivos `.txt` da pasta diretamente** — nunca a partir de
   um `manifest.csv`. Se um `manifest.csv` existir na pasta, ele só serve
   como metadado auxiliar opcional (ex: sugestão de número/coleção por
   nome de arquivo) para pré-preencher campos — nunca como lista de quais
   arquivos existem. Um `.txt` novo tem que aparecer mesmo que ninguém
   tenha tocado no manifest.
4. Compara cada arquivo do Drive com `eac_songs` por `source_file_id`
   (id do Drive) + `source_hash` (hash do conteúdo) — mesma lógica de
   `lib/duplicateDetection.ts`, já implementada e testada.
5. Mostra novos/alterados na tela de importação, reutilizando o mesmo
   preview obrigatório e as mesmas regras de duplicidade/confirmação que
   já existem para upload manual.
6. Responsável seleciona o que importar, revisa o preview, publica ou
   salva como rascunho — idêntico ao fluxo manual.
7. O WebApp público continua servindo sempre a versão publicada na base
   (nunca lê o Drive diretamente na hora da leitura).
8. Upload manual continua funcionando como alternativa/fallback
   permanente, não é substituído.

## O que já está preparado no schema (Fase 1)

- `eac_songs.source_type` já aceita `'DRIVE'` (enum `eac_source_type`),
  além de `'MANUAL'`.
- `eac_songs.source_file_id` e `source_file_name` já existem para guardar
  a referência do arquivo de origem no Drive.
- `eac_import_jobs.source_type` idem — um job de importação já registra se
  veio de upload manual ou do Drive.

Nada disso é usado ainda (todo import atual grava `source_type = 'MANUAL'`),
mas a coluna existir evita uma migration extra quando a integração entrar.

## Variáveis de ambiente previstas (não usadas ainda em código)

```
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

Segredos só no servidor (Route Handler / Server Action), nunca expostos
como `NEXT_PUBLIC_*` nem commitados no repositório — mesma regra que já
vale para as chaves do Supabase.

## Quando implementar

Só depois de:
1. As 41 músicas reais terem sido importadas manualmente com sucesso.
2. O fluxo de preview/duplicidade/publicação ter sido usado em produção
   por um tempo sem sustos.
