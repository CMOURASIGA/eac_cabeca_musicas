import { describe, expect, it } from "vitest";
import { deriveTitleFromFilename, deriveNumberFromFilename } from "./deriveTitle";

describe("deriveTitleFromFilename", () => {
  it("remove número inicial, extensão e capitaliza", () => {
    expect(deriveTitleFromFilename("41_somos_luz.txt")).toBe("Somos Luz");
    expect(deriveTitleFromFilename("vem-espirito-de-deus.txt")).toBe("Vem Espirito De Deus");
  });
});

describe("deriveNumberFromFilename", () => {
  it("lê o número no começo do nome do arquivo", () => {
    expect(deriveNumberFromFilename("41_somos_luz.txt")).toBe(41);
    expect(deriveNumberFromFilename("santo.txt")).toBeNull();
  });
});
