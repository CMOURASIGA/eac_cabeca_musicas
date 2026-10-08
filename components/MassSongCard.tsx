"use client";

import Link from "next/link";
import type { UiSong } from "@/lib/uiSong";

export default function MassSongCard({
  song,
  selected,
  onToggle,
}: {
  song: UiSong;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3 shadow-sm">
      <Link href={"/musica/" + song.slug} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-missa-soft text-xs font-black text-missa">
          {song.number ?? "—"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">{song.title}</span>
          <span className="block truncate text-xs text-ink-soft">
            {song.category} · {song.collection === "EAC" ? "Livro EAC" : "Missa"}
          </span>
        </span>
        <span className="shrink-0 rounded-lg bg-paper-alt px-2 py-1 text-xs font-black text-ink-soft">{song.originalKey}</span>
      </Link>
      <button
        type="button"
        onClick={onToggle}
        aria-label={selected ? "Remover do repertório" : "Adicionar ao repertório"}
        className={
          "grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-lg font-black transition " +
          (selected ? "border-missa bg-missa text-white" : "border-border text-missa")
        }
      >
        {selected ? "✓" : "+"}
      </button>
    </div>
  );
}
