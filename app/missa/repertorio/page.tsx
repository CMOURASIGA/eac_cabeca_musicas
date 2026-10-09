"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import { useMassCatalog } from "@/lib/useCatalog";
import { requestPdf } from "@/lib/pdf/requestPdf";
import {
  deleteMassRepertoire,
  loadMassRepertoires,
  saveMassRepertoire,
  useMassRepertoireDraft,
  type MassRepertoire,
} from "@/lib/useMassRepertoires";

export default function MissaRepertorioPage() {
  const { songs: catalogSongs, error } = useMassCatalog();
  const draft = useMassRepertoireDraft();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [saved, setSaved] = useState<MassRepertoire[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSaved(loadMassRepertoires());
  }, []);

  const songs = useMemo(
    () =>
      draft.songIds
        .map((id) => catalogSongs.find((song) => song.id === id))
        .filter((song): song is (typeof catalogSongs)[number] => Boolean(song)),
    [draft.songIds, catalogSongs]
  );

  function move(index: number, direction: -1 | 1) {
    const next = [...draft.songIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    draft.setSongIds(next);
  }

  function save() {
    if (!name.trim()) {
      setMessage("Informe um nome para o repertório.");
      return;
    }
    if (!draft.songIds.length) {
      setMessage("Adicione ao menos uma música.");
      return;
    }
    const result = saveMassRepertoire({
      id: activeId ?? undefined,
      name: name.trim(),
      eventDate,
      songIds: draft.songIds,
    });
    setActiveId(result.id);
    setSaved(loadMassRepertoires());
    setMessage("Repertório salvo neste aparelho.");
  }

  function load(item: MassRepertoire) {
    setActiveId(item.id);
    setName(item.name);
    setEventDate(item.eventDate);
    draft.setSongIds(item.songIds);
    setMessage("");
  }

  function removeSaved(id: string) {
    deleteMassRepertoire(id);
    setSaved(loadMassRepertoires());
    if (activeId === id) {
      setActiveId(null);
      setName("");
      setEventDate("");
      draft.clear();
    }
  }

  async function generatePdf() {
    if (!songs.length || pdfBusy) return;
    setPdfBusy(true);
    setMessage("Gerando PDF...");
    const result = await requestPdf({
      items: songs.map((s) => ({ slug: s.slug })),
      meetingName: name.trim() || "Repertório da Missa",
      eventDate: eventDate || undefined,
      options: { cifras: true, diagramas: true, capa: true, fontSize: 10 },
    });
    setPdfBusy(false);
    setMessage(result.ok ? "PDF gerado. Confira os downloads." : result.message);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-5 sm:py-6 space-y-5">
      <div className="flex items-start gap-3">
        <Link href="/missa" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-white">←</Link>
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-missa">Celebração</div>
          <h1 className="font-serif text-2xl font-bold text-ink">Repertório da Missa</h1>
          <p className="text-sm text-ink-soft">Monte, organize, salve e gere o repertório para uma celebração específica.</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-ink-soft">
            Nome da celebração
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Missa de domingo 19h"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-normal text-ink outline-none"
            />
          </label>
          <label className="text-xs font-bold text-ink-soft">
            Data
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-normal text-ink outline-none"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 rounded-xl bg-missa px-4 py-3 text-sm font-black text-white">Salvar repertório</button>
          <button
            onClick={generatePdf}
            disabled={!songs.length || pdfBusy}
            className="rounded-xl border border-missa px-4 py-3 text-sm font-black text-missa disabled:opacity-40"
          >
            {pdfBusy ? "Gerando..." : "PDF"}
          </button>
        </div>
        {message && <p className="text-xs font-semibold text-ink-soft">{message}</p>}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-ink">Músicas da celebração</h2>
          <Link href="/missa" className="text-xs font-black text-missa">+ adicionar músicas</Link>
        </div>

        {!songs.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-6 text-center">
            <p className="text-sm text-ink-soft">Nenhuma música adicionada ainda.</p>
            <Link href="/missa" className="mt-2 inline-block text-sm font-black text-missa">Abrir catálogo de Missa</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song, index) => (
              <div key={song.id} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-missa-soft text-xs font-black text-missa">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">{song.title}</div>
                  <div className="truncate text-xs text-ink-soft">{song.category} · Tom {song.originalKey}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(index, -1)} disabled={index === 0} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-xs disabled:opacity-30">↑</button>
                  <button onClick={() => move(index, 1)} disabled={index === songs.length - 1} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-xs disabled:opacity-30">↓</button>
                  <button onClick={() => draft.toggle(song.id)} className="px-2 text-xs font-bold text-red">Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {!!saved.length && (
        <section className="space-y-2">
          <h2 className="text-sm font-black text-ink">Repertórios salvos</h2>
          {saved.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
              <button onClick={() => load(item)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-bold text-ink">{item.name}</div>
                <div className="text-xs text-ink-soft">{item.eventDate || "Sem data"} · {item.songIds.length} música(s)</div>
              </button>
              <button onClick={() => removeSaved(item.id)} className="text-xs font-bold text-red">Excluir</button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
