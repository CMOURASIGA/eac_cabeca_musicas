import { describe, expect, it } from "vitest";
import { parseSongTxt, extractUsedChords, guessKey } from "./parseSongTxt";

const SAMPLE_WITH_FRONT_MATTER = `---
title: SOMOS LUZ
collection: EAC
key: A
number: 41
---

[Verso 1]
A                 E
Caminhando lado a lado
F#m           D
Sempre unidos

[Refrão]
D          A
Somos luz, somos sal
`;

const SAMPLE_LEGACY_NO_FRONT_MATTER = `SOMOS LUZ

A                 E
Caminhando lado a lado
`;

describe("parseSongTxt", () => {
  it("lê o front matter opcional", () => {
    const { frontMatter } = parseSongTxt(SAMPLE_WITH_FRONT_MATTER);
    expect(frontMatter).toEqual({
      title: "SOMOS LUZ",
      collection: "EAC",
      key: "A",
      number: "41",
    });
  });

  it("classifica seções, cifra e letra corretamente", () => {
    const { lines } = parseSongTxt(SAMPLE_WITH_FRONT_MATTER);
    const types = lines.map((l) => l.type);
    expect(types).toContain("section");
    expect(types).toContain("chord");
    expect(types).toContain("lyric");
  });

  it("nunca altera o conteúdo da letra", () => {
    const { lines } = parseSongTxt(SAMPLE_WITH_FRONT_MATTER);
    const lyricLine = lines.find((l) => l.content === "Caminhando lado a lado");
    expect(lyricLine?.type).toBe("lyric");
  });

  it("aceita os TXT legados sem front matter", () => {
    const { frontMatter, lines } = parseSongTxt(SAMPLE_LEGACY_NO_FRONT_MATTER);
    expect(frontMatter).toEqual({});
    expect(lines[0]).toEqual({ type: "lyric", content: "SOMOS LUZ" });
    expect(lines.some((l) => l.type === "chord")).toBe(true);
  });
});

describe("extractUsedChords", () => {
  it("lista os acordes usados sem duplicar", () => {
    const { lines } = parseSongTxt(SAMPLE_WITH_FRONT_MATTER);
    expect(extractUsedChords(lines)).toEqual(["A", "E", "F#m", "D"]);
  });
});

describe("guessKey", () => {
  it("sugere o tom quando o primeiro e o último acorde da música coincidem", () => {
    const { lines } = parseSongTxt(SAMPLE_WITH_FRONT_MATTER); // começa e termina em A
    expect(guessKey(lines)).toBe("A");
  });

  it("cai para o acorde (simplificado) mais frequente quando início e fim não batem", () => {
    const txt = `[Verso]\nEm\nletra\nG\nletra\nEm\nletra\nC\nletra\nD\n`;
    const { lines } = parseSongTxt(txt);
    // Em aparece 2x, G/C/D 1x cada — mais frequente é Em, mas a música
    // termina em D (diferente do início Em), então cai no mais frequente.
    expect(guessKey(lines)).toBe("Em");
  });

  it("retorna null quando não há nenhum acorde na música", () => {
    const { lines } = parseSongTxt("[Verso]\nsó letra, sem cifra\n");
    expect(guessKey(lines)).toBeNull();
  });
});
