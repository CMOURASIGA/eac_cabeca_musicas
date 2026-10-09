"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import ErrorBanner from "@/components/ErrorBanner";
import MassSongCard from "@/components/MassSongCard";
import { useMassCatalog } from "@/lib/useCatalog";
import { matchesQuery } from "@/lib/search";
import { useMassRepertoireDraft } from "@/lib/useMassRepertoires";
import type { UiSong } from "@/lib/uiSong";

export default function MissaPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const { songs, categories, loading, usingSampleData, error } = useMassCatalog();
  const draft = useMassRepertoireDraft();

  const categoryNames = categories.map((c) => c.name);
  const filtered = useMemo(
    () =>
      songs.filter(
        (s) =>
          (category === "Todas" || s.category === category) &&
          (matchesQuery(s.title, query) || String(s.number ?? "").includes(query))
      ),
    [songs, query, category]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, UiSong[]>();
    filtered.forEach((s) => map.set(s.category, [...(map.get(s.category) ?? []), s]));
    return map;
  }, [filtered]);

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 overflow-x-hidden px-3 sm:px-4 py-5 sm:py-6 space-y-4 sm:space-y-5">
      <section className="rounded-[24px] p-5 text-white shadow-sm" style={{ background: "linear-gradient(135deg,#5A4B78 0%,#3E3355 100%)" }}>
        <div className="text-[11px] font-black uppercase tracking-[0.18em] opacity-80">Liturgia</div>
        <h1 className="mt-1 font-serif text-2xl font-bold">Músicas de Missa</h1>
        <p className="mt-1 text-sm opacity-85">Catálogo litúrgico separado do Livro EAC, com músicas próprias e músicas EAC liberadas para celebrações.</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/missa/repertorio" className="rounded-2xl border border-missa/20 bg-white p-4 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-missa">Repertório atual</div>
          <div className="mt-1 text-2xl font-black text-ink">{draft.songIds.length}</div>
          <div className="mt-1 text-xs text-ink-soft">música(s) selecionada(s)</div>
        </Link>
        <Link href="/missa/repertorio" className="rounded-2xl bg-missa p-4 text-white shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide opacity-80">Para a celebração</div>
          <div className="mt-2 text-sm font-bold">Montar repertório →</div>
        </Link>
      </div>

      {usingSampleData && <DemoBanner />}
      {error && <ErrorBanner message={error} />}

      <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-white px-3 py-3 shadow-sm">
        <span className="text-ink-faint">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título ou número"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="mobile-chip-scroll flex gap-2 overflow-x-auto pb-1">
        {["Todas", ...categoryNames].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={
              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold " +
              (category === c ? "border-missa bg-missa text-white" : "border-border bg-white text-ink-soft")
            }
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-ink-soft">Carregando...</p>}

      {!loading &&
        [...grouped.entries()].map(([cat, list]) => (
          <section key={cat} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-[0.14em] text-missa">{cat}</h2>
              <span className="text-[11px] text-ink-faint">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((song) => (
                <MassSongCard
                  key={song.id}
                  song={song}
                  selected={draft.has(song.id)}
                  onToggle={() => draft.toggle(song.id)}
                />
              ))}
            </div>
          </section>
        ))}

      {!loading && !filtered.length && (
        <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-ink-soft">
          Nenhuma música encontrada nesta categoria.
        </p>
      )}

      {draft.songIds.length > 0 && (
        <Link
          href="/missa/repertorio"
          className="sticky bottom-3 flex items-center justify-between rounded-2xl bg-[#0F1B33] px-4 py-3 text-white shadow-xl"
        >
          <span className="text-sm font-bold">{draft.songIds.length} música(s) no repertório</span>
          <span className="text-sm font-black">Continuar →</span>
        </Link>
      )}
    </div>
  );
}
