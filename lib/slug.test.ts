import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("remove acentos e caixa, troca espaços por hífen", () => {
    expect(slugify("Somos Luz")).toBe("somos-luz");
    expect(slugify("Águas Purificadoras")).toBe("aguas-purificadoras");
    expect(slugify("Canção Nova de Amor")).toBe("cancao-nova-de-amor");
  });

  it("remove pontuação", () => {
    expect(slugify("Santo, Santo, Santo")).toBe("santo-santo-santo");
  });
});
