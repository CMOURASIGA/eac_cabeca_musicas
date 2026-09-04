import type { ChordShape } from "@/lib/chordDiagrams";

const STRINGS = 6;
const FRETS_SHOWN = 4;
const W = 44;
const H = 52;
const MARGIN_TOP = 12; // espaço pros marcadores de corda solta/abafada
const MARGIN_SIDE = 4;
const GRID_W = W - MARGIN_SIDE * 2;
const GRID_H = H - MARGIN_TOP - 4;

function stringX(i: number) {
  return MARGIN_SIDE + (GRID_W / (STRINGS - 1)) * i;
}
function fretY(f: number) {
  return MARGIN_TOP + (GRID_H / FRETS_SHOWN) * f;
}

/** Diagrama de acorde (posição de violão) em SVG, do tamanho usado na tela da música. */
export default function ChordDiagram({ shape }: { shape: ChordShape }) {
  const baseFret = shape.baseFret ?? 1;
  const fretted = shape.frets
    .map((f, i) => (typeof f === "number" && f > 0 ? { string: i, fret: f - baseFret + 1 } : null))
    .filter((x): x is { string: number; fret: number } => x !== null);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Diagrama do acorde">
      {/* marcadores de corda solta (o) / abafada (x) acima do diagrama */}
      {shape.frets.map((f, i) => {
        const x = stringX(i);
        if (f === "x") {
          return (
            <text key={i} x={x} y={7} fontSize="6" textAnchor="middle" fill="currentColor" opacity={0.6}>
              ×
            </text>
          );
        }
        if (f === 0) {
          return <circle key={i} cx={x} cy={5} r={2} fill="none" stroke="currentColor" strokeWidth={0.8} opacity={0.7} />;
        }
        return null;
      })}

      {/* pestana no topo do diagrama quando a música não começa na 1ª casa */}
      {baseFret > 1 && (
        <text x={MARGIN_SIDE - 3} y={fretY(0.6)} fontSize="6" fill="currentColor" opacity={0.7}>
          {baseFret}
        </text>
      )}

      {/* traste do zero (nut) mais grosso só quando é posição aberta de verdade */}
      <line
        x1={MARGIN_SIDE}
        y1={fretY(0)}
        x2={MARGIN_SIDE + GRID_W}
        y2={fretY(0)}
        stroke="currentColor"
        strokeWidth={baseFret === 1 ? 1.6 : 0.6}
      />
      {Array.from({ length: FRETS_SHOWN }).map((_, i) => (
        <line
          key={i}
          x1={MARGIN_SIDE}
          y1={fretY(i + 1)}
          x2={MARGIN_SIDE + GRID_W}
          y2={fretY(i + 1)}
          stroke="currentColor"
          strokeWidth={0.6}
          opacity={0.55}
        />
      ))}
      {Array.from({ length: STRINGS }).map((_, i) => (
        <line
          key={i}
          x1={stringX(i)}
          y1={fretY(0)}
          x2={stringX(i)}
          y2={fretY(FRETS_SHOWN)}
          stroke="currentColor"
          strokeWidth={0.6}
          opacity={0.55}
        />
      ))}

      {/* pestana (barra) */}
      {shape.barre && shape.barre.fret - baseFret + 1 <= FRETS_SHOWN && (
        <rect
          x={stringX(shape.barre.fromString) - 3}
          y={fretY(shape.barre.fret - baseFret + 0.5) - 2.4}
          width={stringX(shape.barre.toString) - stringX(shape.barre.fromString) + 6}
          height={4.8}
          rx={2.4}
          fill="currentColor"
          opacity={0.9}
        />
      )}

      {/* dedos */}
      {fretted
        .filter((f) => f.fret <= FRETS_SHOWN)
        .map((f, i) => (
          <circle key={i} cx={stringX(f.string)} cy={fretY(f.fret - 0.5)} r={2.6} fill="currentColor" />
        ))}
    </svg>
  );
}
