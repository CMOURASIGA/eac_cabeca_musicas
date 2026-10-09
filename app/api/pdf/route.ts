import { NextRequest, NextResponse } from "next/server";
import { fetchSongsForPdfBySlug } from "@/lib/pdf/fetchSongsForPdf";
import { buildPdf } from "@/lib/pdf/buildPdf";
import type { PdfOptions } from "@/lib/pdf/PdfDocuments";
import { slugify } from "@/lib/slug";

// @react-pdf/renderer e pdf-lib precisam do runtime Node (não Edge).
export const runtime = "nodejs";

interface PdfRequestBody {
  items: { slug: string; semitones?: number }[];
  options?: Partial<PdfOptions>;
  meetingName?: string;
  eventDate?: string;
}

export async function POST(req: NextRequest) {
  let body: PdfRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const requested = Array.isArray(body.items) ? body.items.filter((i) => i && typeof i.slug === "string") : [];
  if (!requested.length) {
    return NextResponse.json({ error: "Nenhuma música informada." }, { status: 400 });
  }
  if (requested.length > 60) {
    return NextResponse.json({ error: "Muitas músicas de uma vez (limite: 60)." }, { status: 400 });
  }

  const options: PdfOptions = {
    cifras: body.options?.cifras ?? true,
    diagramas: body.options?.diagramas ?? true,
    capa: body.options?.capa ?? requested.length > 1,
    fontSize: Math.max(8, Math.min(14, body.options?.fontSize ?? 9.5)),
  };

  try {
    const songs = await fetchSongsForPdfBySlug(requested.map((i) => i.slug));
    if (!songs.length) {
      return NextResponse.json(
        { error: "Nenhuma das músicas pedidas foi encontrada (ou não está publicada)." },
        { status: 404 }
      );
    }

    const bySlug = new Map(requested.map((i) => [i.slug, i]));
    const items = songs.map((song) => ({ song, semitones: bySlug.get(song.slug)?.semitones ?? 0 }));

    const bytes = await buildPdf({ items, options, meetingName: body.meetingName, eventDate: body.eventDate });

    const filenameBase =
      items.length === 1 ? slugify(items[0].song.title) : slugify(body.meetingName || "repertorio-eac");

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Falha ao gerar PDF:", err);
    return NextResponse.json({ error: "Falha ao gerar o PDF. Tente novamente." }, { status: 500 });
  }
}
