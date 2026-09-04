import { describe, expect, it } from "vitest";
import { findDuplicateCandidate } from "./duplicateDetection";

const EXISTING = [
  { id: "s1", slug: "somos-luz", number: 41, collection: "EAC" as const, sourceHash: "hash-1" },
  { id: "s2", slug: "vaso-novo", number: 3, collection: "EAC" as const, sourceHash: "hash-2" },
  { id: "s3", slug: "santo", number: null, collection: "MISSA" as const, sourceHash: "hash-3" },
];

describe("findDuplicateCandidate", () => {
  it("detecta duplicidade pelo mesmo conteúdo (hash)", () => {
    const result = findDuplicateCandidate(
      { title: "Somos Luz (revisão)", number: 41, collection: "EAC", sourceHash: "hash-1" },
      EXISTING
    );
    expect(result).toEqual({ id: "s1", reason: "same-hash" });
  });

  it("detecta duplicidade pelo título (slug)", () => {
    const result = findDuplicateCandidate(
      { title: "Somos Luz", number: 41, collection: "EAC", sourceHash: "outro-hash" },
      EXISTING
    );
    expect(result).toEqual({ id: "s1", reason: "same-slug" });
  });

  it("detecta duplicidade pelo número dentro da mesma coleção", () => {
    const result = findDuplicateCandidate(
      { title: "Título Totalmente Diferente", number: 3, collection: "EAC", sourceHash: "outro-hash" },
      EXISTING
    );
    expect(result).toEqual({ id: "s2", reason: "same-number" });
  });

  it("não cruza coleções diferentes (EAC x MISSA são catálogos independentes)", () => {
    const result = findDuplicateCandidate(
      { title: "Título Novo", number: 3, collection: "MISSA", sourceHash: "outro-hash" },
      EXISTING
    );
    expect(result).toBeNull();
  });

  it("retorna null quando não há coincidência", () => {
    const result = findDuplicateCandidate(
      { title: "Música Totalmente Nova", number: 99, collection: "EAC", sourceHash: "hash-novo" },
      EXISTING
    );
    expect(result).toBeNull();
  });
});
