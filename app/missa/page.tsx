"use client";

import { useMemo, useState } from "react";
import SongCard from "@/components/SongCard";
import DemoBanner from "@/components/DemoBanner";
import { MISSA_CATEGORIES } from "@/lib/sampleData";
import { useCatalog } from "@/lib/useCatalog";
import { matchesQuery } from "@/lib/search";
import type { UiSong } from "@/lib/uiSong";

export default function MissaPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const { songs, categories, loading, usingSampleData } = useCatalog("MISSA");

  const categoryNames = categories.length ? categories.map((c) => c.name) : MISSA_CATEGORIES;

  const filtered = useMemo(
    () =>
      songs.filter(
        (s) =>
          (category === "Todas" || s.category === category) &&
          (matchesQuery(s.title, query) || matchesQuery(s.sourceText, query))
      ),
    [songs, query, category]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, UiSong[]>();
    filtered.forEach((s) => map.set(s.category, [...(map.get(s.category) ?? []), s]));
    return map;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      <div className="rounded-2xl p-5 text-white" style={{ background: "#5A4B78" }}>
        <h1 className="font-serif text-xl font-semibold">Músicas de Missa</h1>
        <p className="text-sm opacity-85">Catálogo litúrgico · separado do Livro EAC</p>
      </div>

      {usingSampleData && <DemoBanner />}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar título, número ou letra"
        className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Todas", ...categoryNames].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              category === c ? "bg-missa border-missa text-white" : "border-border bg-white text-ink-soft"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-ink-soft">Carregando...</p>}

      {!loading &&
        [...grouped.entries()].map(([cat, list]) => (
          <div key={cat}>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-missa">{cat}</div>
            <div className="space-y-2">
              {list.map((s) => (
                <SongCard key={s.id} song={s} />
              ))}
            </div>
          </div>
        ))}
      {!loading && !filtered.length && <p className="text-sm text-ink-soft">Nenhuma música encontrada nesta categoria.</p>}

      <p className="text-xs text-ink-faint pt-4 border-t border-border">
        A carga real do módulo de Missa entra por importação de TXT com categoria litúrgica própria,
        no mesmo painel administrativo do Livro EAC.
      </p>
    </div>
  );
}
