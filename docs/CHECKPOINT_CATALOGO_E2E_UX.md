# Checkpoint: CATÁLOGO REAL + E2E + UX VALIDATED

Este documento reporta honestamente o que foi validado nesta sessão de
trabalho e o que continua bloqueado — sem considerar o checkpoint fechado
só porque build/TypeScript/testes unitários passaram.

## 1. Testes E2E com Playwright

Duas suítes separadas (detalhes em `e2e/README.md`):

### `e2e/public/` — mockados (modo demonstração, sem Supabase configurado)

- **31 testes**, rodando em **5 projetos de viewport** (360, 390, 430,
  tablet, desktop) = **155 execuções, 155 passaram, 0 falharam**.
- Cobrem: abertura da Home; separação Livro EAC ↔ Missa; busca por título e
  por trecho de letra; abertura de música; transposição +1/−1; retorno ao
  tom original; confirmação de que **só a cifra muda e a letra permanece
  idêntica** após 5 transposições seguidas; alteração de tamanho de fonte;
  tema claro/escuro; auto-scroll (play/pause/velocidade); favoritar com
  persistência após reload; adicionar/remover da seleção com persistência
  entre páginas; compartilhar (fallback de clipboard); diagramas de acorde
  renderizados como SVG real; navegação mobile e desktop; manifest/ícones
  PWA; ausência de overflow horizontal em Home/catálogo/música nos 5
  breakpoints; preservação do número de linhas (alinhamento cifra/letra)
  após transpor.
- Rodar: `npm run test:e2e`.
- **Nota de execução**: `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
  são embutidas em tempo de **build** pelo Next.js, não de `next start`. Para
  rodar a suíte mockada contra um build já existente, zere as duas
  variáveis também no `next build` (não só no `next start`) — o
  `playwright.config.ts` já faz isso automaticamente no seu `webServer`.
  Confirmação final desta sessão, com o build correto: **155 passed (2.0m)**,
  sem nenhuma falha, workers em paralelo, viewport padrão do Playwright.

### `e2e/homolog/` — contra Supabase real (RLS ativa)

- **5 testes escritos**, cobrindo exatamente o que não pode ser mockado:
  bloqueio de `/admin/*` sem sessão (middleware real), login de
  Editor/Admin, importar `.txt` com preview (título/tom sugerido/acordes),
  detecção de duplicidade ao reimportar, e o par
  rascunho-não-aparece-público / publicado-aparece-público.
- **Não executados nesta sessão**: esta sessão de trabalho não tem acesso
  de rede ao projeto Supabase real (`niagdoowqmngxjcrmstd.supabase.co` —
  bloqueado pela política de egress do ambiente) nem às credenciais de um
  Editor/Admin real. Os testes ficam prontos em
  `e2e/homolog/admin-flow.spec.ts`, cada um com
  `test.skip(!hasHomologEnv, ...)`, e rodam assim que alguém com acesso
  definir `E2E_BASE_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` e rodar
  `npm run test:e2e:homolog` — localmente ou liberando a rede desta sessão.

## 2. Catálogo real (41 músicas)

- Os **41 arquivos `.txt` oficiais** estão no repositório em `txt/`
  (confirmado: `ls txt/*.txt | wc -l` → 41).
- **Não foi possível, nesta sessão**, executar a importação real contra o
  Supabase de produção nem confirmar visualmente que `/livro-eac` mostra as
  41 músicas vindas do banco — mesmo bloqueio de rede/credenciais do item
  acima. Isso precisa ser feito por alguém com acesso ao painel
  `/admin/importar` (upload dos 41 `.txt`, publicar em lote) e depois
  conferir `/livro-eac` mostra `41 música(s) publicada(s)` no cabeçalho.
- O que **foi corrigido e é verificável agora**, independente da
  importação real: `lib/useCatalog.ts` não usa mais `sampleData` como
  fallback de erro. Com Supabase configurado, uma falha real de consulta
  (rede, RLS, configuração) **nunca** mais mostra dados de demonstração —
  mostra um `ErrorBanner` vermelho explícito
  ("Não foi possível carregar o catálogo agora... isso não é modo
  demonstração, é um erro real"). `usingSampleData` agora é estritamente
  `!isSupabaseConfigured`, nunca acionado por uma falha de fetch.
  `app/page.tsx`, `app/livro-eac/page.tsx`, `app/missa/page.tsx`,
  `app/selecao/page.tsx` e `app/musica/[slug]/page.tsx` todos renderizam
  esse banner de erro quando aplicável.

## 3. Documentação corrigida: manifest.json (não manifest.csv)

- `docs/GOOGLE_DRIVE_INTEGRATION_PLAN.md` e
  `docs/CHECKPOINT_BASE_TXT_IMPORT_READY.md` corrigidos: toda referência a
  `manifest.csv` virou `manifest.json`.
- Reforçado no próprio texto do plano: a sincronização futura com Drive
  **descobre os `.txt` diretamente na pasta** (`files.list` da API do
  Drive) — o `manifest.json`, se existir, é só metadado auxiliar opcional
  (ex.: sugestão de número/coleção), nunca a lista de quais arquivos
  existem.

## 4. Refinamento visual da página da música (sem redesign)

Mantida a identidade visual aprovada; reestruturada a barra de controles:

- **Antes**: uma única barra rolável horizontal com 11 botões pequenos,
  competindo por atenção.
- **Agora**:
  - Cabeçalho com o título em destaque, sem disputar espaço com controles.
  - Barra principal fixa com botões `−`/`+` de 48×48px (fácil de usar com
    o polegar), tom atual em destaque grande no centro, e um selo dourado
    "↺ Original (tom)" que só aparece quando a música está transposta.
  - Favoritar (♡/♥) e Seleção (+/✓) como botões circulares de 44×44px com
    **feedback visual imediato**: animação de pulso (`eac-pop`, 320ms) ao
    tocar, além da troca de cor/ícone instantânea.
  - Controles secundários (tamanho de fonte, tema, tela cheia, tela
    acordada, compartilhar, PDF) movidos para um menu compacto (botão
    "⋯"), fechado por padrão — não competem mais por atenção durante um
    ensaio/apresentação.
  - Cifra em vermelho e negrito, letra em cor neutra — contraste mantido e
    reforçado.
  - Diagramas de acorde (SVG reais) continuam visíveis abaixo da letra.
- Validado via screenshot real (mobile 390px e desktop) — ver
  `docs/screenshots/` enviados junto com este checkpoint.

### Home

- Mantida a separação clara Livro EAC / Missa (cards grandes, cores
  distintas).
- Personalidade EAC reforçada com uma linha discreta acima dos cards
  ("Firmes na fé, unidos no amor — Banda EAC", extraída do brasão oficial)
  — sem infantilizar, sem elementos de rede social.

## 5. Responsividade

Validado via os 5 projetos Playwright (360/390/430/tablet/desktop):
nenhuma das 155 execuções da suíte mockada detectou overflow horizontal em
Home, `/livro-eac` ou na página da música, e o teste de alinhamento
confirma que o número de linhas de cifra/letra não muda ao transpor (ou
seja, o alinhamento musical se mantém) em nenhum desses tamanhos de tela.

## 6. Escopo respeitado

Nenhum trabalho de Google Drive (implementação) nem geração definitiva de
PDF foi iniciado nesta sessão — só a correção documental do item 3 acima.

## Pendências explícitas para fechar o checkpoint por completo

1. **Rodar a suíte `e2e/homolog/`** contra o Supabase real — precisa de
   rede liberada para `niagdoowqmngxjcrmstd.supabase.co` nesta sessão, OU
   ser rodada localmente/por outra pessoa com acesso e credenciais de
   Editor/Admin.
2. **Importar os 41 `.txt`** via `/admin/importar` e confirmar
   `/livro-eac` mostra as 41 músicas reais — mesmo bloqueio acima.
3. Depois de 1 e 2, anexar a evidência real de RLS (print do rascunho
   ausente em `/livro-eac` e presente após publicar) a este documento.
