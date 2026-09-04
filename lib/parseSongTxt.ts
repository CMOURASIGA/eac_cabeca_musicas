/**
 * Parser do formato TXT editorial descrito na especificação:
 * front matter opcional, marcações de seção ([Verso], [Refrão], [Ponte],
 * [Pré-Refrão]) e linhas de cifra/letra alternadas.
 *
 * Não corrige, reordena ou reescreve nada — apenas classifica cada linha.
 * A letra nunca é tocada; só linhas classificadas como "chord" podem ser
 * transpostas (ver lib/transpose.ts).
 */
import { isChordToken, parseChord } from "./transpose";

export type SongLineType = "section" | "chord" | "lyric" | "blank";

export interface SongLine {
  type: SongLineType;
  content: string;
}

export interface ParsedSong {
  frontMatter: Record<string, string>;
  lines: SongLine[];
}

const SECTION_RE = /^\[(.+)\]$/;

/**
 * Heurística de detecção de linha de cifra: a linha só é "chord" quando
 * TODOS os tokens separados por espaço são acordes reconhecidos pelo motor
 * de transposição. Uma linha de letra que por acaso tenha uma palavra igual
 * a um acorde ("Lá", "Dó" em outra notação, etc.) não é maioria dos casos
 * porque a letra normalmente mistura várias palavras não reconhecidas.
 */
function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const tokens = trimmed.split(/\s+/);
  return tokens.every(isChordToken);
}

function parseFrontMatter(block: string): Record<string, string> {
  const result: Record<string, string> = {};
  block.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) result[key] = value;
  });
  return result;
}

export function parseSongTxt(raw: string): ParsedSong {
  let content = raw.replace(/\r\n/g, "\n");
  let frontMatter: Record<string, string> = {};

  if (content.startsWith("---")) {
    const closingIndex = content.indexOf("\n---", 3);
    if (closingIndex !== -1) {
      const fmBlock = content.slice(3, closingIndex).trim();
      frontMatter = parseFrontMatter(fmBlock);
      content = content.slice(closingIndex + 4).replace(/^\n/, "");
    }
  }

  const lines: SongLine[] = content.split("\n").map((line) => {
    if (line.trim() === "") return { type: "blank", content: "" };
    const sectionMatch = line.trim().match(SECTION_RE);
    if (sectionMatch) return { type: "section", content: sectionMatch[1] };
    if (isChordLine(line)) return { type: "chord", content: line };
    return { type: "lyric", content: line };
  });

  while (lines.length && lines[lines.length - 1].type === "blank") lines.pop();
  while (lines.length && lines[0].type === "blank") lines.shift();

  return { frontMatter, lines };
}

function simplifyForKey(token: string): string | null {
  const chord = parseChord(token);
  if (!chord) return null;
  const isMinor = chord.quality.startsWith("m") && !chord.quality.startsWith("maj") && !chord.quality.startsWith("mM7");
  return chord.root + chord.rootAccidental + (isMinor ? "m" : "");
}

/**
 * Sugestão (não confirmação) de tom quando o TXT não declara `key:` no
 * front matter — a maioria das cifras não escreve o tom em lugar nenhum,
 * só lista os acordes. Heurística padrão de cifra popular: a música quase
 * sempre começa e termina no acorde-tônica; quando isso bate, é o tom. Sem
 * bater, cai para o acorde simplificado (raiz + m se menor) mais frequente.
 * Sempre precisa de confirmação humana antes de publicar — nunca é tratado
 * como certeza.
 */
export function guessKey(lines: SongLine[]): string | null {
  const tokens: string[] = [];
  lines
    .filter((l) => l.type === "chord")
    .forEach((l) => {
      l.content
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .forEach((t) => {
          if (isChordToken(t)) tokens.push(t);
        });
    });
  if (!tokens.length) return null;

  const first = simplifyForKey(tokens[0]);
  const last = simplifyForKey(tokens[tokens.length - 1]);
  if (first && first === last) return first;

  const freq = new Map<string, number>();
  tokens.forEach((t) => {
    const id = simplifyForKey(t);
    if (id) freq.set(id, (freq.get(id) ?? 0) + 1);
  });
  let best: string | null = null;
  let bestCount = 0;
  freq.forEach((count, id) => {
    if (count > bestCount) {
      bestCount = count;
      best = id;
    }
  });
  return best;
}

/** Lista (sem duplicatas, na ordem em que aparecem) dos acordes usados na música. */
export function extractUsedChords(lines: SongLine[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  lines
    .filter((l) => l.type === "chord")
    .forEach((l) => {
      l.content
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .forEach((token) => {
          if (!seen.has(token)) {
            seen.add(token);
            ordered.push(token);
          }
        });
    });
  return ordered;
}
