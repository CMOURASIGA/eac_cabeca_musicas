"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import { parseSongTxt, extractUsedChords } from "@/lib/parseSongTxt";
import { transposeChord, transposeChordLine } from "@/lib/transpose";
import { hasDiagram } from "@/lib/chordDiagrams";
import { useLocalStorageSet } from "@/lib/useLocalStorageSet";
import { usePublishedSong } from "@/lib/useCatalog";

const SPEED_STEPS = [1, 2, 3, 4, 5];
const MIN_FONT = 9;
const MAX_FONT = 26;
const DEFAULT_FONT = 16;
// Aproximação da largura de um caractere em fonte monoespaçada, em unidades
// de font-size (IBM Plex Mono fica perto de 0.6). Usado só para calcular um
// tamanho de fonte inicial que evite overflow horizontal — nunca corta ou
// reflui a cifra/letra em si.
const MONO_CHAR_WIDTH_RATIO = 0.62;

/** Maior tamanho de fonte que cabe em `containerWidth` sem estourar a linha mais longa. */
function computeFitFontSize(lines: { type: string; content: string }[], containerWidth: number): number {
  if (!containerWidth) return DEFAULT_FONT;
  let maxLen = 0;
  for (const l of lines) {
    if (l.type === "chord" || l.type === "lyric") maxLen = Math.max(maxLen, l.content.length);
  }
  if (!maxLen) return DEFAULT_FONT;
  const ideal = Math.floor(containerWidth / (maxLen * MONO_CHAR_WIDTH_RATIO));
  return Math.max(MIN_FONT, Math.min(MAX_FONT, ideal, DEFAULT_FONT));
}

function pushRecent(slug: string) {
  try {
    const raw = window.localStorage.getItem("eac:recent");
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [slug, ...list.filter((s) => s !== slug)].slice(0, 8);
    window.localStorage.setItem("eac:recent", JSON.stringify(next));
  } catch {
    // localStorage indisponível — não é crítico para a leitura da música.
  }
}

export default function SongPage({ params }: { params: { slug: string } }) {
  const { song, usingSampleData } = usePublishedSong(params.slug);
  const favorites = useLocalStorageSet("eac:favorites");
  const selection = useLocalStorageSet("eac:selection");

  const [semitones, setSemitones] = useState(0);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const [userAdjustedFont, setUserAdjustedFont] = useState(false);
  const [dark, setDark] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [wakeLockOn, setWakeLockOn] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (song) pushRecent(song.slug);
  }, [song]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      scrollRef.current?.scrollBy({ top: speedIndex, behavior: "auto" });
    }, 60);
    return () => clearInterval(id);
  }, [playing, speedIndex]);

  useEffect(() => {
    return () => {
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  const parsed = useMemo(() => (song ? parseSongTxt(song.sourceText) : null), [song]);

  // Ajusta a fonte automaticamente pela linha mais longa da música x largura
  // real da tela — mobile, tablet e desktop cada um calcula o seu, evitando
  // overflow horizontal sem precisar de scroll lateral pra ler a letra.
  useEffect(() => {
    if (!parsed || !scrollRef.current) return;
    setUserAdjustedFont(false);
    const width = scrollRef.current.clientWidth - 32; // padding px-4 dos dois lados
    setFontSize(computeFitFontSize(parsed.lines, width));
  }, [parsed]);

  useEffect(() => {
    function handleResize() {
      if (userAdjustedFont || !parsed || !scrollRef.current) return;
      const width = scrollRef.current.clientWidth - 32;
      setFontSize(computeFitFontSize(parsed.lines, width));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [parsed, userAdjustedFont]);

  if (song === undefined) {
    return <div className="mx-auto max-w-xl px-4 py-16 text-center text-ink-soft">Carregando...</div>;
  }

  if (!song || !parsed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-ink-soft">Música não encontrada (ou ainda não publicada).</p>
        <Link href="/livro-eac" className="text-eac font-semibold text-sm">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const currentKey = transposeChord(song.originalKey, semitones);
  const usedChordsOriginal = extractUsedChords(parsed.lines);
  const usedChordsCurrent = usedChordsOriginal.map((c) => transposeChord(c, semitones));
  const accent = song.collection === "EAC" ? "text-eac" : "text-missa";

  function adjustFont(delta: number) {
    setUserAdjustedFont(true);
    setFontSize((f) => Math.max(MIN_FONT, Math.min(MAX_FONT, f + delta)));
  }

  async function toggleWakeLock() {
    if (wakeLockOn) {
      await wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      setWakeLockOn(false);
      return;
    }
    if (!("wakeLock" in navigator)) {
      setShareMsg("Tela sempre acesa não é suportada neste navegador.");
      setTimeout(() => setShareMsg(null), 2500);
      return;
    }
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      setWakeLockOn(true);
    } catch {
      setShareMsg("Não foi possível manter a tela acordada agora.");
      setTimeout(() => setShareMsg(null), 2500);
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: song!.title, url });
      } catch {
        /* usuário cancelou */
      }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareMsg("Link copiado!");
      setTimeout(() => setShareMsg(null), 2000);
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <div className="mx-auto max-w-3xl flex flex-col min-h-[calc(100dvh-57px)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white dark:bg-dark-surface dark:border-dark-border sticky top-[57px] z-10">
        <Link
          href={song.collection === "EAC" ? "/livro-eac" : "/missa"}
          aria-label="Voltar"
          className="grid h-8 w-8 place-items-center rounded-md border border-border shrink-0"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {song.number && (
              <span className={`text-[10.5px] font-bold rounded px-1.5 py-0.5 ${accent} bg-eac-soft`}>
                {song.number}
              </span>
            )}
            <h1 className="font-serif text-base font-semibold truncate">{song.title}</h1>
          </div>
          <p className="text-[11px] text-ink-soft dark:text-ink-faint">
            {song.collection === "EAC" ? "Livro EAC" : "Músicas de Missa"} · Tom atual: {currentKey}
            {semitones !== 0 && ` (original: ${song.originalKey})`}
          </p>
        </div>
      </div>

      {usingSampleData && (
        <div className="px-4 pt-2">
          <DemoBanner />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 border-b border-border bg-white dark:bg-dark-surface dark:border-dark-border text-xs font-semibold">
        <button onClick={() => setSemitones((s) => s - 1)} className="tool">− Tom</button>
        <span className="tool !font-bold">{currentKey}</span>
        <button onClick={() => setSemitones((s) => s + 1)} className="tool">Tom +</button>
        <button onClick={() => setSemitones(0)} className="tool" disabled={semitones === 0}>
          Original
        </button>
        <button onClick={() => adjustFont(-1)} className="tool">A−</button>
        <button onClick={() => adjustFont(1)} className="tool">A+</button>
        <button onClick={() => setDark((d) => !d)} className="tool">{dark ? "Claro" : "Escuro"}</button>
        <button onClick={toggleFullscreen} className="tool">Tela cheia</button>
        <button onClick={toggleWakeLock} className={`tool ${wakeLockOn ? "!bg-eac !text-white" : ""}`}>
          Tela acordada
        </button>
        <button
          onClick={() => favorites.toggle(song.id)}
          className={`tool ${favorites.has(song.id) ? "!text-red !border-red" : ""}`}
        >
          {favorites.has(song.id) ? "♥ Favorito" : "♡ Favoritar"}
        </button>
        <button
          onClick={() => selection.toggle(song.id)}
          className={`tool ${selection.has(song.id) ? "!bg-eac !text-white" : ""}`}
        >
          {selection.has(song.id) ? "✓ Na seleção" : "+ Seleção"}
        </button>
        <button
          onClick={() => {
            setShareMsg("Geração de PDF chega na Fase 2 (repertórios e PDF).");
            setTimeout(() => setShareMsg(null), 2500);
          }}
          className="tool"
        >
          Gerar PDF
        </button>
        <button onClick={share} className="tool">Compartilhar</button>
      </div>

      {shareMsg && (
        <div className="mx-4 mt-2 rounded-lg bg-ink text-white text-xs font-semibold px-3 py-2 self-start">
          {shareMsg}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto chord-scroll px-4 py-5">
        <div className="font-mono leading-[1.9]" style={{ fontSize }}>
          {parsed.lines.map((line, i) => {
            if (line.type === "blank") return <div key={i} className="h-4" />;
            if (line.type === "section")
              return (
                <div key={i} className="font-sans text-[11px] font-bold uppercase tracking-wide text-ink-faint mt-4 mb-1 first:mt-0">
                  {line.content}
                </div>
              );
            if (line.type === "chord")
              return (
                <div key={i} className="whitespace-pre font-bold text-red">
                  {transposeChordLine(line.content, semitones)}
                </div>
              );
            return (
              <div key={i} className="whitespace-pre text-ink dark:text-[#EAF0F3]">
                {line.content}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-white dark:bg-dark-surface dark:border-dark-border">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-eac text-white"
          aria-label={playing ? "Pausar rolagem" : "Iniciar rolagem automática"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <input
          type="range"
          min={0}
          max={SPEED_STEPS.length - 1}
          value={speedIndex}
          onChange={(e) => setSpeedIndex(Number(e.target.value))}
          className="flex-1 accent-eac"
        />
        <span className="text-[11px] font-semibold text-ink-soft shrink-0">Vel. {SPEED_STEPS[speedIndex]}x</span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-4 py-3 border-t border-border bg-paper-alt dark:bg-dark-surface dark:border-dark-border">
        {usedChordsCurrent.length === 0 && (
          <span className="text-xs text-ink-faint">Nenhum acorde detectado nesta música.</span>
        )}
        {usedChordsCurrent.map((chord, i) => (
          <div key={`${chord}-${i}`} className="flex flex-col items-center gap-1 shrink-0 w-14">
            {hasDiagram(chord) ? (
              <div className="h-13 w-11 rounded border border-ink-faint bg-white" style={{ height: 52 }} />
            ) : (
              <div
                className="h-13 w-11 rounded border border-dashed border-ink-faint bg-white grid place-items-center text-center text-[8px] text-ink-faint px-0.5"
                style={{ height: 52 }}
              >
                sem diagrama
              </div>
            )}
            <span className="text-[11px] font-bold">{chord}</span>
          </div>
        ))}
      </div>
      <div className="text-center text-[10px] text-ink-faint bg-paper-alt dark:bg-dark-surface pb-3">
        {song.version} · atualizado em {new Date(song.updatedAt).toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}
