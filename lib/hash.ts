/**
 * Hash do conteúdo do TXT (Web Crypto — disponível em browser, Node 18+ e
 * runtime Edge). Usado para comparar arquivo novo x já importado sem
 * depender só do nome do arquivo.
 */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
