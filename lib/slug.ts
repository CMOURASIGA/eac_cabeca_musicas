import { normalizeForSearch } from "./search";

/** Gera um slug estável a partir do título (usado como chave amigável e para detectar duplicidade). */
export function slugify(title: string): string {
  return normalizeForSearch(title)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
