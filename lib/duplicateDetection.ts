import type { Collection } from "./sampleData";
import { slugify } from "./slug";

export interface ExistingSongForDuplicateCheck {
  id: string;
  slug: string;
  number: number | null;
  collection: Collection;
  sourceHash: string | null;
}

export interface DuplicateCandidate {
  id: string;
  reason: "same-hash" | "same-slug" | "same-number";
}

/**
 * Nunca decide sozinho o que fazer — só aponta a melhor pista de
 * duplicidade para o editor confirmar (ou não) na tela de importação.
 * Prioridade: mesmo conteúdo (hash) > mesmo título (slug) > mesmo número
 * no mesmo catálogo.
 */
export function findDuplicateCandidate(
  candidate: { title: string; number: number | null; collection: Collection; sourceHash: string },
  existing: ExistingSongForDuplicateCheck[]
): DuplicateCandidate | null {
  const sameCollection = existing.filter((s) => s.collection === candidate.collection);

  const sameHash = sameCollection.find((s) => s.sourceHash && s.sourceHash === candidate.sourceHash);
  if (sameHash) return { id: sameHash.id, reason: "same-hash" };

  const candidateSlug = slugify(candidate.title);
  const sameSlug = sameCollection.find((s) => s.slug === candidateSlug);
  if (sameSlug) return { id: sameSlug.id, reason: "same-slug" };

  if (candidate.number != null) {
    const sameNumber = sameCollection.find((s) => s.number === candidate.number);
    if (sameNumber) return { id: sameNumber.id, reason: "same-number" };
  }

  return null;
}
