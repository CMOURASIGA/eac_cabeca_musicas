# Checkpoint: BASE + TXT IMPORT READY

Continuação da Fase 1 sobre o checkpoint de frontend já validado. PDF e
qualquer recurso além do combinado **não foram iniciados**, como pedido.

## O que foi entregue

### 1. Supabase/Postgres conforme o modelo da especificação
`supabase/migrations/0001_init_livro_musicas_eac.sql` (schema) e
`0002_seed_categories.sql` (categorias sugeridas). Só cria objetos novos
(prefixo `eac_`), nunca `DROP`/`ALTER`/`TRUNCATE` em nada pré-existente —
seguro para rodar no projeto `niagdoowqmngxjcrmstd` que já tem outros
dados. Tabelas: `eac_profiles`, `eac_song_categories`, `eac_songs`,
`eac_repertoires`, `eac_repertoire_songs`, `eac_chord_diagrams`,
`eac_import_jobs`, `eac_import_items` — nomes e colunas seguindo o
"Modelo de dados sugerido" da especificação (com pequenos acréscimos
necessários: `search_text` gerado para busca, `eac_profiles` para mapear
usuário → papel).

**Como aplicar:** `docs/SUPABASE_SETUP.md` — passo a passo completo. Eu
não tenho acesso a esse projeto Supabase a partir desta sessão (é de
outra conta), então **você precisa rodar as migrations pelo SQL Editor**
e me passar as chaves (`NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) — combinado na conversa.

### 2. Autenticação só para Editor/Admin, consulta pública sem login
- `middleware.ts` protege `/admin/*` (redireciona para `/admin/login` sem
  sessão).
- `app/admin/login` — e-mail/senha via Supabase Auth. Sem cadastro
  público: o Admin cria a conta (painel do Supabase) e todo usuário novo
  vira `EDITOR` por padrão via trigger; promoção a `ADMIN` é uma linha de
  SQL (documentado em `docs/SUPABASE_SETUP.md`).
- Leitura pública (`/`, `/livro-eac`, `/missa`, `/musica/[slug]`) nunca
  pede login — usa a mesma chave `anon`, e é a RLS que decide o que ela
  enxerga.

### 3. RLS
Todas as tabelas com `row level security` ativado. Resumo das políticas
(detalhe completo no arquivo de migration):
- `eac_songs`, `eac_repertoires`, `eac_repertoire_songs`,
  `eac_chord_diagrams`, `eac_song_categories`: leitura pública só do que
  está `PUBLISHED`/ativo; Editor/Admin enxerga e edita tudo.
- `eac_import_jobs`, `eac_import_items`: 100% interno, nunca público.
- `eac_profiles`: cada usuário só vê o próprio perfil; só Admin
  lista/edita todos (promove/rebaixa papel).
- Duas funções auxiliares (`eac_is_editor_or_admin()`, `eac_is_admin()`)
  concentram a checagem de papel usada em todas as políticas.

### 4. Painel administrativo mínimo
- `/admin/musicas` — lista com filtro por coleção e status, badges
  Publicado/Rascunho/Arquivado, ações rápidas de mudar status.
- `/admin/importar` — fluxo completo de importação (próximo item).
- `/admin/login` — autenticação.

### 5. Importação real de TXT
`app/admin/importar/page.tsx`, upload múltiplo (`<input multiple>`),
para cada arquivo:
- roda o **parser já existente e testado** (`lib/parseSongTxt.ts`) —
  reaproveitado sem alterações;
- detecta título (front matter, senão pelo nome do arquivo — marcado),
  tom (front matter, senão fica em branco e marcado "ambíguo" para
  revisão manual), número, e a lista de acordes usados
  (`extractUsedChords`, já existente);
- calcula hash SHA-256 do conteúdo (`lib/hash.ts`);
- roda a detecção de duplicidade (`lib/duplicateDetection.ts`, testada)
  contra hash / título (slug) / número dentro da mesma coleção;
- **preview obrigatório**: nada é gravado sem passar pela tabela de
  revisão — título, tom e coleção/categoria são editáveis ali antes de
  processar;
- coleção (EAC/Missa) e categoria são escolhidas por linha, com as
  categorias reais vindas do banco;
- rascunho ou publicação é escolha explícita por linha (nunca publica
  sozinho);
- **nunca sobrescreve silenciosamente**: se há duplicidade, a
  atualização só acontece se o editor marcar
  "confirmo substituir a existente"; sem essa marcação a linha é pulada
  (e registrada como `SKIPPED`, não como erro silencioso);
- todo o lote fica registrado em `eac_import_jobs`/`eac_import_items`
  (arquivo, hash, detecção, duplicidade, resultado) para rastreabilidade.

### 6. Catálogo público via persistência real (não mais `sampleData.ts`)
`lib/supabase/publicQueries.ts` + `lib/useCatalog.ts` substituem os
arrays estáticos como fonte das telas `/`, `/livro-eac`, `/missa` e
`/musica/[slug]`. **Fallback automático**: se `NEXT_PUBLIC_SUPABASE_URL`/
`NEXT_PUBLIC_SUPABASE_ANON_KEY` não estiverem definidas, ou a consulta
falhar, a tela mostra um aviso ("modo demonstração") e usa
`lib/sampleData.ts` — é por isso que build/testes passam mesmo sem as
chaves reais configuradas nesta sessão.

`lib/sampleData.ts` continua existindo só para isso e para os testes
automatizados, como combinado.

### 7. Preparação da integração com Google Drive (não implementada)
`docs/GOOGLE_DRIVE_INTEGRATION_PLAN.md` — fluxo completo desenhado,
reforçando que o `manifest.csv` é só auxiliar (novos `.txt` têm que ser
descobertos direto na pasta, nunca dependendo de alguém atualizar um
manifesto). Schema já tem os campos necessários (`source_type = 'DRIVE'`,
`source_file_id`) para quando isso entrar — sem precisar de nova
migration nessa hora.

## As 41 músicas reais — pendente de arquivo

Ainda não recebi os 41 `.txt` de origem, então **não carreguei o
catálogo real** — isso não pode ser inventado (a especificação proíbe
corrigir/inventar letra e cifra). Assim que os arquivos chegarem, o
caminho é: `npm run dev` com as chaves do Supabase configuradas → subir
os 41 arquivos de uma vez em `/admin/importar` → revisar o preview →
publicar. O pipeline já está pronto para isso.

## Testes e build (validados nesta sessão)

```bash
npm run test    # 26 testes (transposição, parser, slug, hash de duplicidade, título por nome de arquivo)
npx tsc --noEmit
npm run build   # build de produção passa com e sem as variáveis do Supabase definidas
```

Também validei manualmente (build de produção + servidor local):
- sem variáveis do Supabase: todas as rotas respondem 200, `/admin/*`
  mostra aviso de configuração pendente, público usa dados de exemplo;
- com variáveis do Supabase apontando para o projeto real (chave
  inválida de propósito, já que não tenho a chave verdadeira): o
  middleware redireciona corretamente `/admin/musicas` → `/admin/login`
  quando não há sessão — confirma que o gate de autenticação funciona
  estruturalmente antes mesmo de eu poder testar contra o banco de
  verdade.

**O que eu não consegui validar** (sem acesso ao projeto): se as
migrations rodam sem erro no seu banco real, e o fluxo de importação
ponta a ponta contra dados reais. Siga `docs/SUPABASE_SETUP.md` passo 5
para validar isso do seu lado — me avise o resultado.

## Não fiz (por decisão explícita sua)

- Geração de PDF.
- Integração com Google Drive (só o plano).
- Reordenação drag-and-drop no repertório.
- Catálogo completo de diagramas de acordes.
- Service worker / cache offline.
