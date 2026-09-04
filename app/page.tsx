"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SongCard from "@/components/SongCard";
import DemoBanner from "@/components/DemoBanner";
import { useLocalStorageSet } from "@/lib/useLocalStorageSet";
import { useAllPublishedSongs } from "@/lib/useCatalog";

export default function HomePage() {
  const favorites = useLocalStorageSet("eac:favorites");
  const selection = useLocalStorageSet("eac:selection");
  const { songs: allSongs, usingSampleData } = useAllPublishedSongs();
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("eac:recent");
      setRecentSlugs(raw ? JSON.parse(raw) : []);
    } catch {
      setRecentSlugs([]);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const favoriteSongs = allSongs.filter((s) => favorites.has(s.id));
  const recentSongs = recentSlugs
    .map((slug) => allSongs.find((s) => s.slug === slug))
    .filter((s): s is (typeof allSongs)[number] => Boolean(s))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10 space-y-10">
      {usingSampleData && <DemoBanner />}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/livro-eac"
          className="rounded-2xl p-6 min-h-[120px] flex flex-col justify-between text-white"
          style={{ background: "linear-gradient(135deg, #0F1B33 0%, #060B18 100%)" }}
        >
          <div>
            <div className="text-xs uppercase tracking-wider opacity-85">Cabeça</div>
            <div className="font-serif text-2xl font-semibold mt-1">Livro EAC</div>
          </div>
          <div className="text-sm font-bold bg-white/15 self-start px-3 py-1.5 rounded-lg">
            Ver o Livro EAC →
          </div>
        </Link>
        <Link
          href="/missa"
          className="rounded-2xl p-6 min-h-[120px] flex flex-col justify-between text-white"
          style={{ background: "linear-gradient(135deg, #5A4B78 0%, #3E3355 100%)" }}
        >
          <div>
            <div className="text-xs uppercase tracking-wider opacity-85">Liturgia</div>
            <div className="font-serif text-2xl font-semibold mt-1">Músicas de Missa</div>
          </div>
          <div className="text-sm font-bold bg-white/15 self-start px-3 py-1.5 rounded-lg">
            Ver catálogo litúrgico →
          </div>
        </Link>
      </section>

      <form action="/livro-eac" className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B969C" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          name="q"
          placeholder="Buscar por título ou trecho da letra"
          className="flex-1 outline-none text-sm placeholder:text-ink-faint bg-transparent"
        />
      </form>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Recentes</h2>
        </div>
        {recentSongs.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {recentSongs.map((s) => (
              <SongCard key={s.id} song={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Nenhuma música visitada ainda.</p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Favoritos</h2>
        </div>
        {favoriteSongs.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {favoriteSongs.map((s) => (
              <SongCard key={s.id} song={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            Toque no coração na tela da música para favoritar — fica salvo neste aparelho.
          </p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Sua seleção atual</h2>
          <Link href="/selecao" className="text-xs font-semibold text-eac">
            ver seleção
          </Link>
        </div>
        <p className="text-sm text-ink-soft">
          {selection.ids.length
            ? `${selection.ids.length} música(s) na sua seleção temporária.`
            : "Adicione músicas à seleção para montar um repertório e gerar PDF."}
        </p>
      </section>

      {installPrompt && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-ink-faint bg-paper-alt p-3">
          <div className="flex-1">
            <div className="text-sm font-semibold">Instalar como app</div>
            <div className="text-xs text-ink-soft">Acesse offline, direto da tela inicial</div>
          </div>
          <button
            onClick={async () => {
              installPrompt.prompt();
              await installPrompt.userChoice;
              setInstallPrompt(null);
            }}
            className="rounded-lg bg-eac px-3 py-2 text-xs font-bold text-white"
          >
            Instalar
          </button>
        </div>
      )}
    </div>
  );
}
