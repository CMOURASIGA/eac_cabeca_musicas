"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SongCard from "@/components/SongCard";
import DemoBanner from "@/components/DemoBanner";
import ErrorBanner from "@/components/ErrorBanner";
import { useCatalog } from "@/lib/useCatalog";
import { matchesQuery } from "@/lib/search";

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
            (matchesQuery(s.title, query) || matchesQuery(s.sourceText, query) || String(s.number ?? "").includes(query))
        )
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [songs, query, category]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      <div className="rounded-2xl p-5 text-white" style={{ background: "#0F1B33" }}>
        <h1 className="font-serif text-xl font-semibold">Livro EAC</h1>
        <p className="text-sm opacity-85">{songs.length} música(s) publicada(s) · Cabeça</p>
      </div>

      {usingSampleData && <DemoBanner />}
      {error && <ErrorBanner message={error} />}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar título, número ou letra"
        className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
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
