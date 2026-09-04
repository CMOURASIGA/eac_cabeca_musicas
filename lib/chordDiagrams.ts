/**
 * Catálogo mínimo de diagramas de acordes (posições abertas de violão,
 * afinação padrão EADGBE) — Fase 1, só para os acordes mais comuns.
 * O catálogo completo evolui a partir do apêndice do PDF de origem,
 * conforme a especificação. Acorde fora daqui mostra "sem diagrama
 * cadastrado" em vez de inventar uma posição.
 */
export interface ChordShape {
  /** 6 posições, da corda mais grave (E) à mais aguda (e): 'x' = solta/abafada não tocada, 0 = solta, N = casa N. */
  frets: (number | "x")[];
  /** Pestana (barra), quando existir: casa e faixa de cordas cobertas (índice 0 = corda grave). */
  barre?: { fret: number; fromString: number; toString: number };
  /** Casa inicial mostrada no diagrama (1 = posição aberta). */
  baseFret?: number;
}

export const CHORD_SHAPES: Record<string, ChordShape> = {
  A: { frets: ["x", 0, 2, 2, 2, 0] },
  Am: { frets: ["x", 0, 2, 2, 1, 0] },
  B: { frets: ["x", 2, 4, 4, 4, 2], barre: { fret: 2, fromString: 1, toString: 5 } },
  Bm: { frets: ["x", 2, 4, 4, 3, 2], barre: { fret: 2, fromString: 1, toString: 5 } },
  C: { frets: ["x", 3, 2, 0, 1, 0] },
  Cm: { frets: ["x", 3, 5, 5, 4, 3], barre: { fret: 3, fromString: 1, toString: 5 } },
  D: { frets: ["x", "x", 0, 2, 3, 2] },
  Dm: { frets: ["x", "x", 0, 2, 3, 1] },
  E: { frets: [0, 2, 2, 1, 0, 0] },
  Em: { frets: [0, 2, 2, 0, 0, 0] },
  F: { frets: [1, 3, 3, 2, 1, 1], barre: { fret: 1, fromString: 0, toString: 5 } },
  Fm: { frets: [1, 3, 3, 1, 1, 1], barre: { fret: 1, fromString: 0, toString: 5 } },
  G: { frets: [3, 2, 0, 0, 0, 3] },
  Gm: { frets: [3, 5, 5, 3, 3, 3], barre: { fret: 3, fromString: 0, toString: 5 } },
};

export function hasDiagram(chord: string): boolean {
  return chord in CHORD_SHAPES;
}

export function getChordShape(chord: string): ChordShape | null {
  return CHORD_SHAPES[chord] ?? null;
}
