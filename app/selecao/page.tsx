"use client";

import Link from "next/link";
import { useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import ErrorBanner from "@/components/ErrorBanner";
import { useLocalStorageSet } from "@/lib/useLocalStorageSet";
import { useAllPublishedSongs } from "@/lib/useCatalog";
import { requestPdf } from "@/lib/pdf/requestPdf";

export default function SelecaoPage() {
  const selection = useLocalStorageSet("eac:selection");
  const { songs: allSongs, usingSampleData, error: catalogError } = useAllPublishedSongs();
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [meetingName, setMeetingName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [includeCifras, setIncludeCifras] = useState(true);
  const [includeDiagramas, setIncludeDiagramas] = useState(true);
  const [includeCapa, setIncludeCapa] = useState(true);
  const [fontSize, setFontSize] = useState(9.5);

  // Ordem da seleção é a própria ordem de selection.ids (persistida). Os
  // botões ↑/↓ reordenam movendo o id na lista salva no localStorage —
  // substitui drag-and-drop por algo simples que já cobre "ordenar" e
  // "remover" pedidos na especificação, sem depender de biblioteca extra.
  const songs = selection.ids
    .map((id) => allSongs.find((s) => s.id === id))
    .filter((s): s is (typeof allSongs)[number] => Boolean(s));

  function moveSong(index: number, direction: -1 | 1) {
    const next = [...selection.ids];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    selection.setIds(next);
  }

  async function generatePdf() {
    if (pdfBusy || !songs.length) return;
    setPdfBusy(true);
    setPdfMsg("Gerando PDF do repertório...");
    const result = await requestPdf({
      items: songs.map((s) => ({ slug: s.slug })),
      options: { cifras: includeCifras, diagramas: includeDiagramas, capa: includeCapa, fontSize },
      meetingName: meetingName.trim() || undefined,
      eventDate: eventDate.trim() || undefined,
    });
    setPdfBusy(false);
    setPdfMsg(result.ok ? "PDF gerado — confira os downloads do navegador." : result.message);
    setTimeout(() => setPdfMsg(null), 4000);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      <div>
        <h1 className="font-serif text-xl font-semibold">Sua seleção</h1>
        <p className="text-sm text-ink-soft">
          Seleção temporária, salva neste aparelho. Repertórios oficiais persistidos pelo
          editor/admin chegam numa próxima fase.
        </p>
      </div>

      {usingSampleData && <DemoBanner />}
      {catalogError && <ErrorBanner message={catalogError} />}

      {!songs.length && (
        <p className="text-sm text-ink-soft rounded-xl border border-dashed border-border p-4">
          Nenhuma música na seleção ainda. Abra uma música e toque em "+ Seleção".
        </p>
      )}

      <div className="space-y-2">
        {songs.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5">
            <span className="text-xs font-bold text-ink-faint w-5">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{s.title}</div>
              <div className="text-xs text-ink-soft">
                {s.collection === "EAC" ? "Livro EAC" : "Missa"} · Tom {s.originalKey}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => moveSong(i, -1)}
                disabled={i === 0}
                aria-label="Mover para cima"
                className="grid h-7 w-7 place-items-center rounded-md border border-border text-xs disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => moveSong(i, 1)}
                disabled={i === songs.length - 1}
                aria-label="Mover para baixo"
                className="grid h-7 w-7 place-items-center rounded-md border border-border text-xs disabled:opacity-30"
              >
                ↓
              </button>
              <button onClick={() => selection.toggle(s.id)} className="text-xs font-semibold text-red px-1.5">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {!!songs.length && (
        <div className="rounded-xl border border-border bg-white p-4 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-faint">Opções do PDF</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-ink-soft space-y-1">
              Nome do encontro (opcional)
              <input
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Ex.: EAC 37"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm font-normal text-ink outline-none"
              />
            </label>
            <label className="block text-xs font-semibold text-ink-soft space-y-1">
              Data (opcional)
              <input
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="Ex.: 12/10/2026"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm font-normal text-ink outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-ink">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={includeCapa} onChange={(e) => setIncludeCapa(e.target.checked)} />
              Capa
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={includeCifras} onChange={(e) => setIncludeCifras(e.target.checked)} />
              Cifras
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={includeDiagramas}
                onChange={(e) => setIncludeDiagramas(e.target.checked)}
              />
              Diagramas de acorde
            </label>
          </div>

          <label className="block text-xs font-semibold text-ink-soft space-y-1">
            Tamanho da fonte no PDF
            <input
              type="range"
              min={8}
              max={14}
              step={0.5}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-eac"
            />
          </label>

          <button
            onClick={generatePdf}
            disabled={pdfBusy}
            className="w-full rounded-xl bg-eac py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {pdfBusy ? "Gerando PDF..." : "Gerar PDF do repertório"}
          </button>
          {pdfMsg && <p className="text-xs text-ink-soft">{pdfMsg}</p>}
        </div>
      )}

      <Link href="/livro-eac" className="inline-block text-sm font-semibold text-eac">
        ← Continuar navegando no Livro EAC
      </Link>
    </div>
  );
}
