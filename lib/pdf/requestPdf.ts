"use client";

export interface RequestPdfItem {
  slug: string;
  semitones?: number;
}

export interface RequestPdfOptions {
  cifras?: boolean;
  diagramas?: boolean;
  capa?: boolean;
  fontSize?: number;
}

export interface RequestPdfInput {
  items: RequestPdfItem[];
  options?: RequestPdfOptions;
  meetingName?: string;
  eventDate?: string;
}

/** Chama /api/pdf e dispara o download do arquivo gerado no navegador do visitante. */
export async function requestPdf(input: RequestPdfInput): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, message: data?.error ?? "Falha ao gerar o PDF." };
    }

    const blob = await res.blob();
    const filename =
      res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "livro-eac.pdf";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch {
    return { ok: false, message: "Não foi possível gerar o PDF agora. Verifique a conexão e tente de novo." };
  }
}
