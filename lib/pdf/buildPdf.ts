import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { UiSong } from "@/lib/uiSong";
import { PdfDocs, type PdfOptions } from "./PdfDocuments";

export interface PdfBuildItem {
  song: UiSong;
  semitones: number;
}

export interface BuildPdfInput {
  items: PdfBuildItem[];
  options: PdfOptions;
  meetingName?: string;
  eventDate?: string;
}

/**
 * Monta o PDF final: renderiza cada música separadamente com
 * @react-pdf/renderer (layout rico, cifra/letra monoespaçada, diagramas),
 * depois usa pdf-lib para juntar capa + índice + músicas num único
 * arquivo e desenhar a numeração de página global (rodapé), já que
 * react-pdf sozinho não sabe em que página global cada música vai cair
 * antes de tudo estar montado.
 */
export async function buildPdf({ items, options, meetingName, eventDate }: BuildPdfInput): Promise<Uint8Array> {
  const isBooklet = options.capa || items.length > 1;

  // 1) Renderiza cada música isoladamente e mede quantas páginas ela ocupa.
  const songBuffers: Buffer[] = [];
  const songPageCounts: number[] = [];
  for (const item of items) {
    const buf = await renderToBuffer(
      PdfDocs.SongDocument({ song: item.song, semitones: item.semitones, options, showFooterMeta: !isBooklet })
    );
    songBuffers.push(buf);
    const doc = await PDFDocument.load(buf);
    songPageCounts.push(doc.getPageCount());
  }

  const final = await PDFDocument.create();
  const contentPageIndexes: number[] = []; // páginas (no doc final) que recebem rodapé com numeração

  // 2) Capa (opcional).
  if (options.capa) {
    const coverBuf = await renderToBuffer(PdfDocs.CoverDocument({ meetingName, eventDate, songCount: items.length }));
    const coverDoc = await PDFDocument.load(coverBuf);
    const [coverPage] = await final.copyPages(coverDoc, [0]);
    final.addPage(coverPage);
  }

  // 3) Índice (só quando há mais de uma música) — página(s) do índice entram
  //    ANTES das músicas, e o índice já sabe onde cada uma começa porque as
  //    contagens de página das músicas foram medidas no passo 1.
  if (items.length > 1) {
    const indexPageCountProbe = await renderToBuffer(
      PdfDocs.IndexDocument({ entries: items.map((it, i) => ({ number: i + 1, title: it.song.title, page: 1 })) })
    );
    const indexPageCount = (await PDFDocument.load(indexPageCountProbe)).getPageCount();

    let cursor = (options.capa ? 1 : 0) + indexPageCount + 1; // primeira página de música (1-based)
    const entries = items.map((it, i) => {
      const page = cursor;
      cursor += songPageCounts[i];
      return { number: i + 1, title: it.song.title, page };
    });

    const indexBuf = await renderToBuffer(PdfDocs.IndexDocument({ entries }));
    const indexDoc = await PDFDocument.load(indexBuf);
    const indexPages = await final.copyPages(indexDoc, indexDoc.getPageIndices());
    indexPages.forEach((p) => final.addPage(p));
  }

  // 4) Músicas, na ordem pedida.
  for (const buf of songBuffers) {
    const doc = await PDFDocument.load(buf);
    const pages = await final.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => {
      contentPageIndexes.push(final.getPageCount());
      final.addPage(p);
    });
  }

  // 5) Rodapé com numeração global — só no modo "livro fechado" (capa/índice
  //    presentes); um PDF de música avulsa já traz seu próprio rodapé
  //    (versão/data) desenhado pelo react-pdf, sem precisar de outra camada.
  if (isBooklet) {
    const font = await final.embedFont(StandardFonts.Helvetica);
    const total = contentPageIndexes.length;
    contentPageIndexes.forEach((pageIndex, i) => {
      const page = final.getPage(pageIndex);
      const { width } = page.getSize();
      const label = `Meu Canto, Minha Fé — EAC · pág. ${i + 1}/${total}`;
      const textWidth = font.widthOfTextAtSize(label, 8);
      page.drawText(label, {
        x: width - 36 - textWidth,
        y: 20,
        size: 8,
        font,
        color: rgb(0.3, 0.35, 0.38),
      });
    });
  }

  return final.save();
}
