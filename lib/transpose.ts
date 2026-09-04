/**
 * Motor de transposição de acordes.
 *
 * Atua somente sobre tokens reconhecidos como acordes. Nunca deve ser usado
 * para alterar letra — quem decide o que é "linha de cifra" é o parser
 * (ver lib/parseSongTxt.ts), este módulo só transpõe o token em si.
 */

const SHARP_SCALE = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
const FLAT_SCALE = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"];

const NOTE_TO_INDEX: Record<string, number> = {};
SHARP_SCALE.forEach((note, index) => (NOTE_TO_INDEX[note] = index));
FLAT_SCALE.forEach((note, index) => (NOTE_TO_INDEX[note] = index));
// grafias enarmônicas menos comuns, mas válidas em cifras
NOTE_TO_INDEX["E#"] = NOTE_TO_INDEX["F"];
NOTE_TO_INDEX["B#"] = NOTE_TO_INDEX["C"];
NOTE_TO_INDEX["Cb"] = NOTE_TO_INDEX["B"];
NOTE_TO_INDEX["Fb"] = NOTE_TO_INDEX["E"];

// Sufixos de qualidade/extensão reconhecidos (menores, sétimas, maiores,
// diminutos, suspensos, extensões). Cada iteração do grupo consome um
// sufixo inteiro, então itens mais específicos vêm antes dos genéricos.
const QUALITY_TOKENS = [
  "maj13", "maj11", "maj9", "maj7", "add9", "add11", "add13",
  "sus2", "sus4", "sus", "dim7", "dim", "aug", "m7b5",
  "m6", "m7", "m9", "m11", "m13", "mM7", "m",
  "7M", "M7", "6/9", "69", "6", "7", "9", "11", "13", "5", "4",
  "ø", "°", "º", "\\+",
  // extensões entre parênteses como usadas nas cifras reais importadas:
  // "D7(4)", "E7(11)", "C#7(9+)", "B7(9/11+/13)"
  "\\([0-9+\\-/]+\\)",
] as const;

const QUALITY_RE = `(?:${QUALITY_TOKENS.join("|")})*`;
// parênteses envolvendo o acorde inteiro são comuns em anotações de cifra
// ("(D)", "(A/C#)") e são só um detalhe de grafia, não afetam o acorde em si.
const CHORD_RE = new RegExp(`^(\\()?([A-G])(#|b)?(${QUALITY_RE})(?:/([A-G])(#|b)?)?(\\))?$`);

export interface ParsedChord {
  root: string;
  rootAccidental: "#" | "b" | "";
  quality: string;
  bass: string | null;
  bassAccidental: "#" | "b" | "";
  hasOpenParen: boolean;
  hasCloseParen: boolean;
}

export function parseChord(token: string): ParsedChord | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const match = trimmed.match(CHORD_RE);
  if (!match) return null;
  const [, openParen, root, rootAcc, quality, bass, bassAcc, closeParen] = match;
  // Parênteses podem não estar balanceados no MESMO token quando anotam um
  // grupo de vários acordes ("(E/G# E D/F# E/G#)"): o primeiro token carrega
  // só o "(" e o último só o ")". Cada lado é tratado independentemente.
  return {
    root,
    rootAccidental: (rootAcc as "#" | "b") ?? "",
    quality: quality ?? "",
    bass: bass ?? null,
    bassAccidental: (bassAcc as "#" | "b") ?? "",
    hasOpenParen: Boolean(openParen),
    hasCloseParen: Boolean(closeParen),
  };
}

/** É um token de acorde reconhecido pelo motor (usado pelo parser de TXT). */
export function isChordToken(token: string): boolean {
  return parseChord(token) !== null;
}

function shiftNote(note: string, accidental: string, semitones: number, preferFlat: boolean): string {
  const index = NOTE_TO_INDEX[note + accidental];
  if (index === undefined) return note + accidental;
  const newIndex = (((index + semitones) % 12) + 12) % 12;
  return (preferFlat ? FLAT_SCALE : SHARP_SCALE)[newIndex];
}

/** Transpõe um único token de acorde em `semitones` semitons. Texto que não é acorde volta inalterado. */
export function transposeChord(token: string, semitones: number): string {
  if (semitones === 0) return token;
  const chord = parseChord(token);
  if (!chord) return token;
  const newRoot = shiftNote(chord.root, chord.rootAccidental, semitones, chord.rootAccidental === "b");
  let result = newRoot + chord.quality;
  if (chord.bass) {
    const newBass = shiftNote(chord.bass, chord.bassAccidental, semitones, chord.bassAccidental === "b");
    result += "/" + newBass;
  }
  if (chord.hasOpenParen) result = "(" + result;
  if (chord.hasCloseParen) result = result + ")";
  return result;
}

/**
 * Transpõe apenas os tokens de acorde de uma linha de cifra, preservando
 * espaços/alinhamento ao redor de cada token.
 */
export function transposeChordLine(line: string, semitones: number): string {
  if (semitones === 0) return line;
  return line.replace(/\S+/g, (token) => transposeChord(token, semitones));
}

/** Distância em semitons de uma nota/tom para outra (0-11, sempre para cima). */
export function semitonesBetween(fromKey: string, toKey: string): number {
  const from = parseChord(fromKey);
  const to = parseChord(toKey);
  if (!from || !to) return 0;
  const fromIndex = NOTE_TO_INDEX[from.root + from.rootAccidental];
  const toIndex = NOTE_TO_INDEX[to.root + to.rootAccidental];
  return ((toIndex - fromIndex) % 12 + 12) % 12;
}

export const ALL_KEYS = SHARP_SCALE;
