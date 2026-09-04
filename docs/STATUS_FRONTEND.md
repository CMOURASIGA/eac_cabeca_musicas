# Status do frontend — para validação

Este é o primeiro incremento real de código, cobrindo o núcleo da **Fase 1**
da especificação (banco/catálogo/parser/leitura), com dados de exemplo no
lugar de um backend ainda não implementado. Serve para você validar a
experiência de uso antes de conectar Supabase, importação real de TXT e PDF.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # testes do motor de transposição e do parser de TXT
npm run build    # build de produção (validado nesta sessão)
```

## O que já funciona de verdade (não é mockup estático)

- **Motor de transposição** (`lib/transpose.ts`) — cobre notas naturais,
  sustenidos, bemóis, menores, sétimas, maiores, diminutos, suspensos,
  inversões (`D/F#`) e extensões (`C7M`, `Cadd9`...). 12 testes unitários.
- **Parser de TXT** (`lib/parseSongTxt.ts`) — lê front matter opcional,
  marcações `[Verso]`/`[Refrão]`/`[Ponte]`/`[Pré-Refrão]`, classifica cada
  linha como seção/cifra/letra e nunca altera a letra. Aceita TXT legado
  sem front matter. 5 testes unitários.
- **Tela da música** (`/musica/[slug]`) — título, tom atual, transpor
  +/-, restaurar tom original, aumentar/reduzir fonte, tema claro/escuro,
  rolagem automática com velocidade ajustável e pausa, tela cheia, manter
  tela acordada (Wake Lock API, com aviso quando o navegador não suporta),
  favoritar, adicionar à seleção, compartilhar (Web Share API com
  fallback para copiar link), cifra em negrito e cor distinta da letra,
  diagramas apenas dos acordes usados (com aviso de "sem diagrama
  cadastrado" quando aplicável), versão/data de atualização. Sem overflow
  horizontal no mobile (a cifra rola dentro de uma área contida).
- **Catálogo Livro EAC** (`/livro-eac`) e **Músicas de Missa** (`/missa`,
  agrupado pelas categorias litúrgicas da especificação) — busca
  ignorando caixa/acentos, filtro por categoria.
- **Home** (`/`) — entradas para os dois módulos, busca, recentes (por
  navegação real), favoritos e resumo da seleção atual.
- **Seleção** (`/selecao`) — persistida no navegador (sem login),
  remoção de itens.
- **Favoritos/seleção/recentes** — `localStorage`, por aparelho, sem
  exigir login, como pede a especificação.
- **Identidade visual e PWA básica** — paleta extraída da logo oficial do
  EAC (`#014373` / `#D01528` / creme), ícone do app e favicon gerados a
  partir do arquivo real da logo, `manifest.webmanifest`.

## Dados usados agora (não são a carga real)

As músicas em `lib/sampleData.ts` são **conteúdo de exemplo**, não as 41
músicas do PDF oficial. Só "Somos Luz" tem letra completa (o mesmo texto
fictício do esboço aprovado), para exercitar o parser e a transposição
ponta a ponta; as demais têm só metadados + um trecho placeholder. A
importação da carga real (Fase 1/3) ainda não foi implementada.

## Deixado para as próximas fases (combinadas na especificação)

- Persistência real (Supabase/Postgres), autenticação de editor/admin, RLS.
- Importação de TXT (upload, preview, detecção de duplicidade) e
  integração com Google Drive.
- Geração de PDF server-side (por música, seleção ou repertório).
- Catálogo completo de diagramas de acordes (hoje só um conjunto mínimo
  de exemplo em `lib/chordDiagrams.ts`).
- Reordenação drag-and-drop na seleção/repertório (hoje só lista + remover).
- Service worker / cache offline de verdade (o manifest e os ícones já
  existem; falta o service worker para instalar como PWA completo).
- Painel administrativo (importação, listagem com status, auditoria).

Fico por aqui neste incremento para não estourar escopo/tokens sem
entregar algo que já dá para você abrir, navegar e aprovar.
