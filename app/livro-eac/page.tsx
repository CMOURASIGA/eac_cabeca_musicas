"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SongCard from "@/components/SongCard";
import { EAC_SONGS } from "@/lib/sampleData";
import { matchesQuery } from "@/lib/search";

const CATEGORIES = ["Todas", ...Array.from(new Set(EAC_SONGS.map((s) => s.category)))];

function CatalogEAC() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("Todas");

  const songs = useMemo(
    () =>
      EAC_SONGS.filter(
        (s) =>
          (category === "Todas" || s.category === category) &&
          (matchesQuery(s.title, query) || String(s.number).includes(query))
      ).sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [query, category]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      <div className="rounded-2xl p-5 text-white" style={{ background: "#014373" }}>
        <h1 className="font-serif text-xl font-semibold">Livro EAC</h1>
        <p className="text-sm opacity-85">{EAC_SONGS.length} músicas · Cabeça</p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar título, número ou letra"
        className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
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
        {songs.map((s) => (
          <SongCard key={s.id} song={s} />
        ))}
        {!songs.length && <p className="text-sm text-ink-soft">Nenhuma música encontrada.</p>}
      </div>
    </div>
  );
}

export default function LivroEacPage() {
  return (
    <Suspense>
      <CatalogEAC />
    </Suspense>
  );
}
