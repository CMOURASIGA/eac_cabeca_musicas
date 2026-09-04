# Checkpoint: Geração de PDF (Fase 2)

PDF é requisito de primeira classe segundo a especificação. Implementado
nesta sessão, server-side, sem navegador headless (compatível com função
serverless do Vercel).

## O que foi implementado

- **PDF individual**: botão "Gerar PDF" no menu secundário da tela da
  música (`/musica/[slug]`) — gera a música no tom atualmente exibido
  (respeitando a transposição feita pelo visitante), com cifras em negrito
  vermelho, letra monoespaçada preservando alinhamento, e diagramas dos
  acordes usados.
- **PDF do repertório/seleção**: em `/selecao`, com opções de nome do
  encontro, data, incluir/excluir capa, cifras e diagramas, e tamanho de
  fonte — gera um "livro fechado": capa com marca EAC, índice com número de
  página real de cada música, músicas na ordem definida (com botões ↑/↓
  para reordenar), rodapé com numeração global de página.
- Diagramas de acorde no PDF usam o mesmo catálogo de shapes da tela
  (`lib/chordDiagrams.ts`); acorde sem shape cadastrado mostra "sem
  diagrama" no PDF também — nunca inventa uma posição.
- Nunca separa uma linha de cifra da linha de letra correspondente entre
  páginas (bloco cifra+letra sempre fica junto).
- Saída A4, como pedido na especificação.

## Como funciona (arquitetura)

- `lib/pdf/PdfDocuments.tsx` — documentos React construídos com
  `@react-pdf/renderer` (capa, índice, música) — roda no servidor, sem
  Chromium/Puppeteer.
- `lib/pdf/ChordDiagramPdf.tsx` — mesma geometria de
  `components/ChordDiagram.tsx`, redesenhada com as primitivas SVG do
  react-pdf.
- `lib/pdf/buildPdf.ts` — renderiza cada música separadamente (para medir
  quantas páginas ela ocupa), depois usa `pdf-lib` para montar capa +
  índice (com os números de página reais, calculados a partir das
  contagens medidas) + músicas, e desenha o rodapé com numeração global.
- `app/api/pdf/route.ts` — rota `POST /api/pdf` (`runtime: "nodejs"`),
  busca as músicas pedidas (Supabase quando configurado — só `PUBLISHED`,
  a mesma regra de RLS do resto do app — ou `sampleData` em modo
  demonstração) e devolve o PDF (`application/pdf`, `Content-Disposition:
  attachment`).
- `lib/pdf/requestPdf.ts` — helper client-side que chama a rota e dispara
  o download no navegador do visitante.

## Fontes usadas no PDF

De propósito, só fontes padrão do PDF (Helvetica/Courier) — Courier é
monoespaçada, então o espaçamento cifra/letra do TXT original fica
preservado sem precisar embutir arquivo de fonte customizado (simplifica o
deploy: nada de fonte para buscar/embutir em runtime serverless).

## Validado nesta sessão

- Testado ponta a ponta contra o build local em modo demonstração:
  PDF individual (uma música, com transposição aplicada) e PDF de
  repertório com 3 músicas (capa, índice com páginas corretas, rodapé
  numerado, diagramas reais e "sem diagrama" honesto) — PDFs válidos
  confirmados (`file` reconhece `PDF document, version 1.7`) e conteúdo
  inspecionado visualmente.
- Casos de erro testados: slug inexistente → 404 com mensagem clara;
  request sem músicas → 400; limite de 60 músicas por requisição.
- 2 testes E2E novos em `e2e/public/song.spec.ts` (PDF individual) e
  `e2e/public/pdf.spec.ts` (PDF do repertório + reordenação) —
  suíte completa: **170/170 passou** (34 testes × 5 breakpoints).

## O que ainda não entra aqui (fora de escopo desta entrega)

- Repertórios **persistidos** pelo editor/admin (hoje só a seleção local
  do visitante, em `localStorage`, gera PDF) — a tabela `eac_repertoires`
  já existe no schema, falta a UI de gestão.
- Tom específico por música dentro do repertório salvo (hoje o PDF de
  repertório usa o tom original de cada música; só o PDF individual
  respeita a transposição feita na tela).
- Campo de observações por música/repertório no PDF.
