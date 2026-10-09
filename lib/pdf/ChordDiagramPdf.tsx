import { Circle, G, Line, Rect, Svg, Text as SvgText } from "@react-pdf/renderer";
import type { ChordShape } from "@/lib/chordDiagrams";

/**
 * Mesma geometria de components/ChordDiagram.tsx (versão HTML/SVG da tela),
 * redesenhada com as primitivas de @react-pdf/renderer — react-pdf não
 * renderiza <svg> do DOM, precisa dos componentes próprios (Svg/Line/...).
 */
const STRINGS = 6;
const FRETS_SHOWN = 4;
const W = 44;
const H = 52;
const MARGIN_TOP = 12;
const MARGIN_SIDE = 4;
const GRID_W = W - MARGIN_SIDE * 2;
const GRID_H = H - MARGIN_TOP - 4;
const INK = "#11202B";

function stringX(i: number) {
  return MARGIN_SIDE + (GRID_W / (STRINGS - 1)) * i;
}
function fretY(f: number) {
  return MARGIN_TOP + (GRID_H / FRETS_SHOWN) * f;
}

export function ChordDiagramPdf({ shape }: { shape: ChordShape }) {
  const baseFret = shape.baseFret ?? 1;
  const fretted = shape.frets
    .map((f, i) => (typeof f === "number" && f > 0 ? { string: i, fret: f - baseFret + 1 } : null))
    .filter((x): x is { string: number; fret: number } => x !== null);

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {shape.frets.map((f, i) => {
        const x = stringX(i);
        if (f === "x") {
          return (
            <SvgText key={i} x={x - 2} y={7} style={{ fontSize: 6, fill: INK, opacity: 0.6 }}>
              x
            </SvgText>
          );
        }
        if (f === 0) {
          return <Circle key={i} cx={x} cy={5} r={2} stroke={INK} strokeWidth={0.8} fill="none" opacity={0.7} />;
        }
        return null;
      })}

      {baseFret > 1 && (
        <SvgText x={MARGIN_SIDE - 3} y={fretY(0.6)} style={{ fontSize: 6, fill: INK, opacity: 0.7 }}>
          {String(baseFret)}
        </SvgText>
      )}

      <Line
        x1={MARGIN_SIDE}
        y1={fretY(0)}
        x2={MARGIN_SIDE + GRID_W}
        y2={fretY(0)}
        stroke={INK}
        strokeWidth={baseFret === 1 ? 1.6 : 0.6}
      />
      {Array.from({ length: FRETS_SHOWN }).map((_, i) => (
        <Line
          key={i}
          x1={MARGIN_SIDE}
          y1={fretY(i + 1)}
          x2={MARGIN_SIDE + GRID_W}
          y2={fretY(i + 1)}
          stroke={INK}
          strokeWidth={0.6}
          opacity={0.55}
        />
      ))}
      {Array.from({ length: STRINGS }).map((_, i) => (
        <Line
          key={i}
          x1={stringX(i)}
          y1={fretY(0)}
          x2={stringX(i)}
          y2={fretY(FRETS_SHOWN)}
          stroke={INK}
          strokeWidth={0.6}
          opacity={0.55}
        />
      ))}

      {shape.barre && shape.barre.fret - baseFret + 1 <= FRETS_SHOWN && (
        <G opacity={0.9}>
          <Rect
            x={stringX(shape.barre.fromString) - 3}
            y={fretY(shape.barre.fret - baseFret + 0.5) - 2.4}
            width={stringX(shape.barre.toString) - stringX(shape.barre.fromString) + 6}
            height={4.8}
            rx={2.4}
            fill={INK}
          />
        </G>
      )}

      {fretted
        .filter((f) => f.fret <= FRETS_SHOWN)
        .map((f, i) => (
          <Circle key={i} cx={stringX(f.string)} cy={fretY(f.fret - 0.5)} r={2.6} fill={INK} />
        ))}
    </Svg>
  );
}
