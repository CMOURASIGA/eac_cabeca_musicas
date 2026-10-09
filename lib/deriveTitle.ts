/** Título "melhor esforço" quando o TXT não tem front matter com `title:`. */
export function deriveTitleFromFilename(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  const withoutLeadingNumber = base.replace(/^\d+[_\-. ]*/, "");
  const spaced = withoutLeadingNumber.replace(/[_\-]+/g, " ").trim();
  if (!spaced) return base;
  return spaced
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Número no início do nome do arquivo, ex: "41_somos_luz.txt" -> 41. */
export function deriveNumberFromFilename(fileName: string): number | null {
  const match = fileName.match(/^(\d+)[_\-. ]/);
  return match ? Number(match[1]) : null;
}
