/**
 * Catálogo mínimo de diagramas de acordes (Fase 1 — só para demonstrar o
 * comportamento "mostra apenas os acordes usados e avisa quando não há
 * diagrama cadastrado"). O catálogo completo evolui a partir do apêndice
 * do PDF de origem, conforme a especificação.
 */
export const KNOWN_CHORD_DIAGRAMS = new Set([
  "A", "B", "C", "D", "E", "F", "G",
  "Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm",
]);

export function hasDiagram(chord: string): boolean {
  return KNOWN_CHORD_DIAGRAMS.has(chord);
}
