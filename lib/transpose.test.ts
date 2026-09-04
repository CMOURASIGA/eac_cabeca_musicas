import { describe, expect, it } from "vitest";
import { isChordToken, transposeChord, transposeChordLine, semitonesBetween } from "./transpose";

describe("transposeChord", () => {
  it("mantém o acorde quando semitons é 0", () => {
    expect(transposeChord("G", 0)).toBe("G");
  });

  it("transpõe notas naturais e menores", () => {
    expect(transposeChord("G", 2)).toBe("A");
    expect(transposeChord("Em", 2)).toBe("F#m");
  });

  it("transpõe inversões (baixo com slash)", () => {
    expect(transposeChord("D/F#", 2)).toBe("E/G#");
  });

  it("transpõe sétima maior preservando a extensão", () => {
    expect(transposeChord("C7M", 2)).toBe("D7M");
  });

  it("cobre sustenidos, bemóis, diminutos, suspensos e extensões", () => {
    expect(transposeChord("F#m7", 1)).toBe("Gm7");
    expect(transposeChord("Bb", 1)).toBe("B");
    expect(transposeChord("Cdim", 2)).toBe("Ddim");
    expect(transposeChord("Gsus4", 2)).toBe("Asus4");
    expect(transposeChord("Cadd9", 2)).toBe("Dadd9");
  });

  it("preserva grafia com bemol quando o acorde original usa bemol", () => {
    expect(transposeChord("Bb", 2)).toBe("C");
    expect(transposeChord("Eb", -1)).toBe("D");
  });

  it("mantém texto que não é acorde reconhecido", () => {
    expect(transposeChord("Deus", 2)).toBe("Deus");
    expect(transposeChord("Caminhando", 2)).toBe("Caminhando");
  });
});

describe("transposeChordLine", () => {
  it("transpõe apenas os tokens de acorde, preservando espaçamento", () => {
    const line = "A                 E";
    expect(transposeChordLine(line, 2)).toBe("B                 F#");
  });

  it("nunca altera a linha de letra correspondente (a letra não é entrada desta função de cifra)", () => {
    const lyric = "Caminhando lado a lado";
    // mesmo se aplicada por engano, o motor só reconhece tokens de acorde válidos
    expect(transposeChordLine(lyric, 2)).toBe(lyric);
  });
});

describe("isChordToken", () => {
  it("reconhece acordes válidos", () => {
    ["A", "Em", "F#m", "D/F#", "C7M", "Bb", "Gsus4", "Cadd9", "Ddim7"].forEach((c) =>
      expect(isChordToken(c)).toBe(true)
    );
  });

  it("rejeita palavras de letra comuns", () => {
    ["Deus", "Caminhando", "Sempre", "amor", "Como"].forEach((w) =>
      expect(isChordToken(w)).toBe(false)
    );
  });
});

describe("semitonesBetween", () => {
  it("calcula a distância entre dois tons", () => {
    expect(semitonesBetween("G", "A")).toBe(2);
    expect(semitonesBetween("A", "A")).toBe(0);
    expect(semitonesBetween("A", "G")).toBe(10);
  });
});
