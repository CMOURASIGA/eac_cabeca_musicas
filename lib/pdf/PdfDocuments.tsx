import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { extractUsedChords, parseSongTxt, type SongLine } from "@/lib/parseSongTxt";
import { transposeChord, transposeChordLine } from "@/lib/transpose";
import { getChordShape } from "@/lib/chordDiagrams";
import type { UiSong } from "@/lib/uiSong";
import { ChordDiagramPdf } from "./ChordDiagramPdf";

/**
 * Documentos PDF do Livro de Músicas EAC, montados com @react-pdf/renderer
 * (renderiza no servidor, sem navegador headless — roda numa função
 * serverless do Vercel de boa). Fontes padrão do PDF (Helvetica/Courier)
 * de propósito: Courier é monoespaçada, então o espaçamento cifra/letra do
 * TXT original (a mesma técnica usada na tela) fica preservado sem
 * precisar embutir fontes customizadas.
 */

export interface PdfSongInput {
  song: UiSong;
  semitones: number;
}

export interface PdfOptions {
  cifras: boolean;
  diagramas: boolean;
  capa: boolean;
  fontSize: number;
}

const NAVY = "#0F1B33";
const RED = "#C81F2C";
const INK = "#11202B";
const INK_SOFT = "#4C5A62";
const GOLD = "#A9843F";

const styles = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 40, paddingHorizontal: 36, fontFamily: "Helvetica" },
  coverPage: {
    backgroundColor: NAVY,
    color: "#F3EAD3",
    padding: 48,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  coverEyebrow: { fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.75 },
  coverTitle: { fontSize: 30, fontFamily: "Helvetica-Bold", marginTop: 8 },
  coverSubtitle: { fontSize: 13, marginTop: 6, opacity: 0.85 },
  coverMeeting: { fontSize: 16, marginTop: 40, fontFamily: "Helvetica-Bold" },
  coverDate: { fontSize: 11, marginTop: 4, opacity: 0.85 },
  coverFooter: { fontSize: 9, opacity: 0.6 },

  indexTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 14 },
  indexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E4D9B9",
    paddingVertical: 5,
  },
  indexRowTitle: { fontSize: 10.5, color: INK },
  indexRowNumber: { fontSize: 10.5, color: INK_SOFT, marginRight: 8, width: 22 },
  indexRowPage: { fontSize: 10.5, color: INK_SOFT },

  songHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  songTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  songNumber: { fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY, backgroundColor: "#E3E7ED", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  songTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: INK },
  songMeta: { fontSize: 9, color: INK_SOFT, marginTop: 2 },
  keyBadge: { fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY, borderWidth: 1, borderColor: NAVY, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },

  sectionLabel: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK_SOFT, textTransform: "uppercase", marginTop: 8, marginBottom: 2 },
  chordLine: { fontFamily: "Courier-Bold", color: RED, whiteSpace: "pre" },
  lyricLine: { fontFamily: "Courier", color: INK, whiteSpace: "pre" },
  blankLine: { height: 6 },

  diagramsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 10, borderTopWidth: 0.5, borderTopColor: "#E4D9B9", paddingTop: 10 },
  diagramItem: { alignItems: "center", width: 40 },
  diagramLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: INK, marginTop: 2 },
  diagramMissing: { width: 44, height: 52, borderWidth: 0.5, borderColor: INK_SOFT, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  diagramMissingText: { fontSize: 5, color: INK_SOFT, textAlign: "center", paddingHorizontal: 2 },
});

function CoverDocument({
  meetingName,
  eventDate,
  songCount,
}: {
  meetingName?: string;
  eventDate?: string;
  songCount: number;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={styles.coverEyebrow}>Banda EAC · Livro de Músicas</Text>
          <Text style={styles.coverTitle}>Meu Canto, Minha Fé</Text>
          <Text style={styles.coverSubtitle}>
            {songCount} música{songCount === 1 ? "" : "s"} nesta seleção
          </Text>
        </View>
        <View>
          {meetingName && <Text style={styles.coverMeeting}>{meetingName}</Text>}
          {eventDate && <Text style={styles.coverDate}>{eventDate}</Text>}
          <Text style={[styles.coverFooter, { marginTop: meetingName || eventDate ? 24 : 0 }]}>
            Gerado pelo WebApp Meu Canto, Minha Fé — EAC
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function IndexDocument({ entries }: { entries: { number: number; title: string; page: number }[] }) {
  const ROWS_PER_PAGE = 34;
  const pages: (typeof entries)[] = [];
  for (let i = 0; i < entries.length; i += ROWS_PER_PAGE) pages.push(entries.slice(i, i + ROWS_PER_PAGE));

  return (
    <Document>
      {pages.map((rows, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {pageIndex === 0 && <Text style={styles.indexTitle}>Índice</Text>}
          {rows.map((entry) => (
            <View key={entry.number} style={styles.indexRow}>
              <View style={{ flexDirection: "row" }}>
                <Text style={styles.indexRowNumber}>{String(entry.number).padStart(2, "0")}</Text>
                <Text style={styles.indexRowTitle}>{entry.title}</Text>
              </View>
              <Text style={styles.indexRowPage}>pág. {entry.page}</Text>
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}

/** Agrupa cada linha de cifra com a linha de letra imediatamente seguinte, para nunca separar as duas entre páginas. */
function groupLines(lines: SongLine[]) {
  const blocks: SongLine[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.type === "chord" && lines[i + 1]?.type === "lyric") {
      blocks.push([line, lines[i + 1]]);
      i++;
    } else {
      blocks.push([line]);
    }
  }
  return blocks;
}

function SongDocument({
  song,
  semitones,
  options,
  showFooterMeta = true,
}: {
  song: UiSong;
  semitones: number;
  options: PdfOptions;
  showFooterMeta?: boolean;
}) {
  const parsed = parseSongTxt(song.sourceText);
  const currentKey = transposeChord(song.originalKey, semitones);
  const usedChordsOriginal = extractUsedChords(parsed.lines);
  const usedChordsCurrent = usedChordsOriginal.map((c) => transposeChord(c, semitones));
  const blocks = groupLines(parsed.lines);
  const fontSize = options.fontSize;

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.songHeader} fixed>
          <View style={styles.songTitleWrap}>
            {song.number != null && <Text style={styles.songNumber}>{song.number}</Text>}
            <View>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songMeta}>
                {song.collection === "EAC" ? "Livro EAC" : "Músicas de Missa"} · {song.category}
                {semitones !== 0 ? ` · tom original ${song.originalKey}` : ""}
              </Text>
            </View>
          </View>
          <Text style={styles.keyBadge}>Tom {currentKey}</Text>
        </View>

        {blocks.map((block, i) => (
          <View key={i} wrap={false}>
            {block.map((line, j) => {
              if (line.type === "blank") return <View key={j} style={styles.blankLine} />;
              if (line.type === "section") return <Text key={j} style={styles.sectionLabel}>{line.content}</Text>;
              if (line.type === "chord") {
                if (!options.cifras) return null;
                return (
                  <Text key={j} style={[styles.chordLine, { fontSize }]}>
                    {transposeChordLine(line.content, semitones)}
                  </Text>
                );
              }
              return (
                <Text key={j} style={[styles.lyricLine, { fontSize }]}>
                  {line.content || " "}
                </Text>
              );
            })}
          </View>
        ))}

        {options.diagramas && usedChordsCurrent.length > 0 && (
          <View style={styles.diagramsWrap} wrap={false}>
            {usedChordsCurrent.map((chord, i) => {
              const shape = getChordShape(chord);
              return (
                <View key={`${chord}-${i}`} style={styles.diagramItem}>
                  {shape ? (
                    <ChordDiagramPdf shape={shape} />
                  ) : (
                    <View style={styles.diagramMissing}>
                      <Text style={styles.diagramMissingText}>sem diagrama</Text>
                    </View>
                  )}
                  <Text style={styles.diagramLabel}>{chord}</Text>
                </View>
              );
            })}
          </View>
        )}

        {showFooterMeta && (
          <Text
            fixed
            style={{ position: "absolute", bottom: 18, left: 36, fontSize: 7.5, color: INK_SOFT }}
          >
            {song.version} · atualizado em {new Date(song.updatedAt).toLocaleDateString("pt-BR")}
          </Text>
        )}
      </Page>
    </Document>
  );
}

export const PdfDocs = { CoverDocument, IndexDocument, SongDocument };
