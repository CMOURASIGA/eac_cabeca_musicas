"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import ErrorBanner from "@/components/ErrorBanner";
import { useLocalStorageSet } from "@/lib/useLocalStorageSet";
import { useAllPublishedSongs } from "@/lib/useCatalog";

function CompactSongRow({ song, favorite = false }: { song: any; favorite?: boolean }) {
  return (
    <Link href={"/musica/" + song.slug} className="flex items-center gap-3 rounded-2xl border border-border/80 bg-white/80 px-3 py-3 shadow-[0_2px_10px_rgba(15,27,51,0.04)]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F0EBE5] text-sm font-black text-eac">
        {song.number ?? "—"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-black text-ink">{song.title}</span>
        <span className="block truncate text-xs text-ink-soft">{song.category}</span>
      </span>
      <span className="rounded-xl bg-gold-soft px-2.5 py-1.5 text-xs font-black text-ink-soft">{song.originalKey}</span>
      {favorite ? <span className="text-lg text-red">♥</span> : <span className="text-lg text-ink-faint">⋮</span>}
    </Link>
  );
}

export default function HomePage() {
  const favorites = useLocalStorageSet("eac:favorites");
  const selection = useLocalStorageSet("eac:selection");
  const { songs: allSongs, usingSampleData, error: catalogError } = useAllPublishedSongs();
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("eac:recent");
      setRecentSlugs(raw ? JSON.parse(raw) : []);
    } catch {
      setRecentSlugs([]);
    }
  }, []);

  const favoriteSongs = allSongs.filter((s) => favorites.has(s.id)).slice(0, 3);
  const recentSongs = recentSlugs
    .map((slug) => allSongs.find((s) => s.slug === slug))
    .filter((s): s is (typeof allSongs)[number] => Boolean(s))
    .slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-28 pt-4 sm:px-5 sm:pb-10 sm:pt-7">
      <div className="space-y-5 sm:space-y-7">
        {usingSampleData && <DemoBanner />}
        {catalogError && <ErrorBanner message={catalogError} />}

        <section className="relative overflow-hidden rounded-[28px] border border-gold/25 bg-gradient-to-br from-[#FFFDF6] via-[#FFF8E6] to-[#F6E7BD] px-5 py-6 shadow-[0_8px_30px_rgba(169,132,63,0.08)] sm:px-8 sm:py-9">
          <div className="absolute -right-1 top-1 h-32 w-32 opacity-20 sm:h-40 sm:w-40">
            <div className="absolute left-1/2 top-2 h-28 w-[3px] -translate-x-1/2 bg-gold-deep" />
            <div className="absolute left-[34%] top-9 h-[3px] w-[32%] bg-gold-deep" />
          </div>
          <div className="relative max-w-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gold-deep">Bem-vindo(a)!</p>
            <h1 className="mt-1 font-serif text-[32px] font-bold leading-none text-eac sm:text-5xl">Cabeça do EAC</h1>
            <p className="mt-2 text-sm text-ink-soft sm:text-base">Músicas que unem nossa fé, missão e comunidade.</p>
          </div>
        </section>

        <form action="/livro-eac" className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3.5 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B969C" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input name="q" placeholder="Buscar por título ou número..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint" />
        </form>

        <section className="grid grid-cols-2 gap-3">
          <Link href="/livro-eac" className="flex min-h-[148px] flex-col justify-between rounded-[24px] bg-gradient-to-br from-[#132348] to-[#0A1229] p-4 text-white shadow-md sm:min-h-[170px] sm:p-6">
            <div>
              <div className="text-2xl sm:text-3xl">▤</div>
              <h2 className="mt-3 font-serif text-xl font-bold sm:text-2xl">Livro EAC</h2>
              <p className="mt-1 text-xs text-white/70">{allSongs.filter((s) => s.collection === "EAC").length} músicas</p>
            </div>
            <span className="self-end rounded-full bg-white/10 px-3 py-1.5 text-lg">→</span>
          </Link>
          <Link href="/missa" className="flex min-h-[148px] flex-col justify-between rounded-[24px] bg-gradient-to-br from-[#765487] to-[#4F3566] p-4 text-white shadow-md sm:min-h-[170px] sm:p-6">
            <div>
              <div className="text-2xl sm:text-3xl">♪</div>
              <h2 className="mt-3 font-serif text-xl font-bold sm:text-2xl">Músicas de Missa</h2>
              <p className="mt-1 text-xs text-white/70">Catálogo litúrgico</p>
            </div>
            <span className="self-end rounded-full bg-white/10 px-3 py-1.5 text-lg">→</span>
          </Link>
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-xl font-bold text-eac">Recentes</h2>
            <Link href="/livro-eac" className="text-xs font-bold text-ink-soft">Ver todas</Link>
          </div>
          {recentSongs.length ? recentSongs.map((s) => <CompactSongRow key={s.id} song={s} />) : (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 p-4 text-sm text-ink-soft">Nenhuma música visitada ainda.</div>
          )}
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-xl font-bold text-eac">Favoritas</h2>
            <Link href="/livro-eac" className="text-xs font-bold text-ink-soft">Ver todas</Link>
          </div>
          {favoriteSongs.length ? favoriteSongs.map((s) => <CompactSongRow key={s.id} song={s} favorite />) : (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 p-4 text-sm text-ink-soft">Toque no coração na tela da música para favoritar.</div>
          )}
        </section>

        {selection.ids.length > 0 && (
          <Link href="/selecao" className="flex items-center justify-between rounded-2xl bg-eac px-4 py-3 text-white shadow-md">
            <span className="text-sm font-bold">{selection.ids.length} música(s) na seleção</span>
            <span className="text-sm font-black">Abrir →</span>
          </Link>
        )}
      </div>
    </main>
  );
}
