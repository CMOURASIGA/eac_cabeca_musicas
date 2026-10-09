/** Normaliza texto para busca ignorando caixa e acentos. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesQuery(haystack: string, query: string): boolean {
  if (!query.trim()) return true;
  return normalizeForSearch(haystack).includes(normalizeForSearch(query));
}
