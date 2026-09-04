# Testes E2E — Livro de Músicas EAC

Duas suítes claramente separadas, como pedido no checkpoint de homologação.

## 1. `e2e/public/` — testes mockados (modo demonstração)

Rodam contra `next build && next start` **sem** `NEXT_PUBLIC_SUPABASE_URL`/
`NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas (ver `playwright.config.ts`), ou
seja, o app cai deliberadamente em modo demonstração e serve `lib/sampleData.ts`.

Cobrem toda a experiência pública que **não depende de validar Supabase/RLS
de verdade**: navegação, busca, abertura de música, transposição (+1/−1/
original), preservação da letra ao transpor, tamanho de fonte, tema claro/
escuro, auto-scroll (play/pause/velocidade), favoritos e persistência,
seleção e persistência, compartilhar, diagramas de acorde, navegação mobile
e desktop, PWA/manifest, responsividade em 360/390/430/tablet/desktop.

Comando: `npm run test:e2e` (ou `npx playwright test`).

**Uma exceção importante**: com Supabase não configurado, o `middleware.ts`
deixa `/admin/*` passar sem exigir login (comentário no próprio código:
"Sem Supabase configurado ainda: deixa passar (modo demonstração), mas o
próprio /admin exibe um aviso — não há dado sensível em risco"). Por isso,
o teste de bloqueio de `/admin/*` para usuário não autenticado mockado
valida a **camada de dados** (a página não consegue carregar músicas reais
sem Supabase configurado, mostra erro/estado vazio, nunca dados) e o
redirecionamento em si é validado na suíte de homologação abaixo, que roda
com Supabase de verdade configurado.

## 2. `e2e/homolog/` — testes E2E contra o ambiente de homologação real

Rodam contra uma instância real do app **com Supabase configurado de
verdade** (RLS ativa) — local (`.env.local` com as credenciais reais) ou o
deployment de homologação no Vercel.

Cobrem exatamente o que o checkpoint pede que não pode ser mockado:

- Login de Editor/Admin de verdade (Supabase Auth).
- Abrir `/admin/musicas`, importar um `.txt`, ver o preview, identificar
  título/tom sugerido/acordes, identificar duplicidade, salvar como
  rascunho, publicar.
- Confirmar que um rascunho **não** aparece em `/livro-eac` (RLS pública só
  libera `status = 'PUBLISHED'`).
- Confirmar que, após publicar, a música aparece em `/livro-eac`.
- Confirmar que `/admin/*` redireciona para `/admin/login` quando não há
  sessão (aqui o middleware realmente valida contra o Supabase configurado).

Essa suíte **não roda em CI/local por padrão** — cada teste começa com
`test.skip(!hasHomologEnv, ...)` e só executa quando as variáveis abaixo
estão definidas, exatamente para nunca rodar sem querer contra produção nem
mascarar a ausência de execução real como "passou":

```
E2E_BASE_URL=https://<preview-ou-homolog>.vercel.app   (ou http://localhost:3000)
E2E_ADMIN_EMAIL=<email de um Editor/Admin real>
E2E_ADMIN_PASSWORD=<senha desse Editor/Admin>
```

Comando: `E2E_BASE_URL=... E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npx playwright test -c playwright.homolog.config.ts`

**Estado atual (ver relatório do checkpoint)**: esta sessão de trabalho não
tem acesso de rede ao projeto Supabase real (`niagdoowqmngxjcrmstd.supabase.co`)
nem às credenciais do Editor/Admin — os testes estão escritos e prontos,
mas precisam ser executados por alguém com acesso (localmente, ou liberando
a política de rede desta sessão) para gerar evidência real de RLS.
