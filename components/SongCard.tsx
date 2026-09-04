import Link from "next/link";
import type { UiSong } from "@/lib/uiSong";

export default function SongCard({ song }: { song: UiSong }) {
  const accent = song.collection === "EAC" ? "text-eac bg-eac-soft" : "text-missa bg-missa-soft";
  return (
    <Link
      href={`/musica/${song.slug}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 hover:border-eac/40 transition-colors"
    >
      <span className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold shrink-0 ${accent}`}>
        {song.number ?? "—"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{song.title}</span>
        <span className="block text-xs text-ink-soft">{song.category}</span>
      </span>
      <span className="shrink-0 rounded-md bg-paper-alt px-2 py-1 text-xs font-bold text-ink-soft">
        {song.originalKey}
      </span>
    </Link>
  );
}
