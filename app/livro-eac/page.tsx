"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SongCard from "@/components/SongCard";
import DemoBanner from "@/components/DemoBanner";
import ErrorBanner from "@/components/ErrorBanner";
import { useCatalog } from "@/lib/useCatalog";
import { matchesQuery } from "@/lib/search";

const titleCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

function CatalogEAC() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("Todas");
  const { songs, categories, loading, usingSampleData, error } = useCatalog("EAC");

  const categoryNames = useMemo(
    () => ["Todas", ...(categories.length ? categories.map((c) => c.name) : Array.from(new Set(songs.map((s) => s.category))))],
    [categories, songs]
  );

  const filtered = useMemo(
    () =>
      songs
        .filter(
          (s) =>
            (category === "Todas" || s.category === category) &&
            (matchesQuery(s.title, query) || String(s.number ?? "").includes(query))
        )
        .sort((a, b) => titleCollator.compare(a.title, b.title)),
    [songs, query, category]
  );

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 overflow-x-hidden px-3 sm:px-4 py-5 pb-24 sm:py-6 sm:pb-6 space-y-4 sm:space-y-5">
      <div className="rounded-[24px] p-5 text-white shadow-sm" style={{ background: "linear-gradient(135deg,#0F1B33 0%,#091126 100%)" }}>
        <h1 className="font-serif text-xl font-semibold">Livro EAC</h1>
        <p className="text-sm opacity-85">{songs.length} música(s) publicada(s) · Cabeça</p>
      </div>

      {usingSampleData && <DemoBanner />}
      {error && <ErrorBanner message={error} />}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por título ou número"
        className="w-full min-w-0 rounded-xl border border-border bg-white px-3 sm:px-4 py-3 text-sm outline-none"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mobile-chip-scroll">
        {categoryNames.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              category === c ? "bg-eac border-eac text-white" : "border-border bg-white text-ink-soft"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading && <p className="text-sm text-ink-soft">Carregando...</p>}
        {!loading && filtered.map((s) => <SongCard key={s.id} song={s} />)}
        {!loading && !filtered.length && <p className="text-sm text-ink-soft">Nenhuma música encontrada.</p>}
      </div>
    </div>
  );
}

export default function LivroEacPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-6 text-sm text-ink-soft">Carregando...</div>}>
      <CatalogEAC />
    </Suspense>
  );
}
