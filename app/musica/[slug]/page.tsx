"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import ErrorBanner from "@/components/ErrorBanner";
import { requestPdf } from "@/lib/pdf/requestPdf";
import { parseSongTxt, extractUsedChords } from "@/lib/parseSongTxt";
import { transposeChord, transposeChordLine } from "@/lib/transpose";
import ChordDiagram from "@/components/ChordDiagram";
import { getChordShape } from "@/lib/chordDiagrams";
import { useLocalStorageSet } from "@/lib/useLocalStorageSet";
import { usePublishedSong } from "@/lib/useCatalog";

const SPEED_STEPS = [1, 2, 3, 4, 5];
const MIN_FONT = 13;
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
  const { song, usingSampleData, error } = usePublishedSong(params.slug);
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [favPulse, setFavPulse] = useState(false);
  const [selPulse, setSelPulse] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
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
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-3">
        {error ? <ErrorBanner message={error} /> : <p className="text-ink-soft">Música não encontrada (ou ainda não publicada).</p>}
        <Link href="/livro-eac" className="text-eac font-semibold text-sm block">
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

  function toggleFavorite() {
    favorites.toggle(song!.id);
    setFavPulse(true);
    setTimeout(() => setFavPulse(false), 320);
  }

  function toggleSelection() {
    selection.toggle(song!.id);
    setSelPulse(true);
    setTimeout(() => setSelPulse(false), 320);
  }

  async function generatePdf() {
    if (pdfBusy) return;
    setPdfBusy(true);
    setShareMsg("Gerando PDF...");
    const result = await requestPdf({ items: [{ slug: song!.slug, semitones }] });
    setPdfBusy(false);
    setShareMsg(result.ok ? "PDF gerado — confira os downloads." : result.message);
    setTimeout(() => setShareMsg(null), 3000);
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
    <div className="mx-auto flex min-h-screen w-full max-w-3xl min-w-0 flex-col overflow-x-hidden bg-[#FFFDF7]">
      <div className="sticky top-0 z-30 flex min-w-0 items-center gap-3 border-b border-border/70 bg-[#FFFDF7]/95 px-3 py-3 backdrop-blur sm:top-[57px] sm:px-4">
        <Link
          href={song.collection === "EAC" ? "/livro-eac" : "/missa"}
          aria-label="Voltar"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-white text-xl text-eac shadow-sm"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {song.number && (
              <span className={`text-[11px] font-bold rounded px-1.5 py-0.5 ${accent} bg-eac-soft shrink-0`}>
                {song.number}
              </span>
            )}
            <h1 className="min-w-0 truncate font-serif text-[22px] font-bold leading-tight text-eac sm:text-2xl">{song.title}</h1>
          </div>
          <p className="text-[11px] text-ink-soft dark:text-ink-faint">
            {song.collection === "EAC" ? "Livro EAC" : "Músicas de Missa"}
          </p>
        </div>
      </div>

      {usingSampleData && (
        <div className="px-4 pb-2">
          <DemoBanner />
        </div>
      )}
      {error && (
        <div className="px-4 pb-2">
          <ErrorBanner message={error} />
        </div>
      )}

      <section className="px-4 pt-5 sm:px-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-[24px] border border-border bg-white p-4 shadow-sm">
        <button
          onClick={() => setSemitones((s) => s - 1)}
          aria-label="Transpor um tom abaixo"
          className="justify-self-start grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-eac bg-white text-3xl font-bold text-eac shadow-sm active:scale-95 transition-transform"
        >
          −
        </button>
        <div className="flex min-w-[90px] flex-col items-center justify-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">Tom atual</span>
          <span className="mt-1 rounded-2xl bg-paper px-5 py-2 font-serif text-3xl font-extrabold leading-none text-eac">{currentKey}</span>
        </div>
        <button
          onClick={() => setSemitones((s) => s + 1)}
          aria-label="Transpor um tom acima"
          className="justify-self-end grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-eac bg-white text-3xl font-bold text-eac shadow-sm active:scale-95 transition-transform"
        >
          +
        </button>

        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-[20px] border border-border bg-white p-2 shadow-sm">
          <button onClick={() => adjustFont(1)} className="rounded-xl px-2 py-2.5 text-center">
            <span className="block font-serif text-xl font-black text-eac">A</span>
            <span className="block text-[10px] font-bold text-ink-soft">Fonte</span>
          </button>
          <button onClick={() => setPlaying((p) => !p)} className="rounded-xl px-2 py-2.5 text-center">
            <span className="block text-xl text-eac">{playing ? "❚❚" : "▶"}</span>
            <span className="block text-[10px] font-bold text-ink-soft">Auto Scroll</span>
          </button>
          <button onClick={toggleFullscreen} className="rounded-xl px-2 py-2.5 text-center">
            <span className="block text-xl text-eac">⛶</span>
            <span className="block text-[10px] font-bold text-ink-soft">Modo tocar</span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          {semitones !== 0 ? (
            <button onClick={() => setSemitones(0)} className="rounded-full bg-gold-soft px-3 py-2 text-xs font-bold text-gold-deep">
              ↺ Original ({song.originalKey})
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button onClick={toggleFavorite} className={`grid h-10 w-10 place-items-center rounded-full border text-lg ${favorites.has(song.id) ? "border-red text-red" : "border-border text-ink-faint"}`}>
              {favorites.has(song.id) ? "♥" : "♡"}
            </button>
            <button onClick={toggleSelection} className={`grid h-10 w-10 place-items-center rounded-full border text-lg font-bold ${selection.has(song.id) ? "border-eac bg-eac text-white" : "border-border text-ink-faint"}`}>
              {selection.has(song.id) ? "✓" : "+"}
            </button>
            <button onClick={() => setMenuOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-border text-lg text-ink-faint">⋯</button>
          </div>
        </div>
      </section>

      {/* Controles secundários: escondidos por padrão pra não disputar atenção durante a execução */}
      {menuOpen && (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-border bg-paper-alt dark:bg-dark-surface dark:border-dark-border text-xs font-semibold">
          <button onClick={() => adjustFont(-1)} className="tool">A−</button>
          <button onClick={() => adjustFont(1)} className="tool">A+</button>
          <button onClick={() => setDark((d) => !d)} className="tool">{dark ? "Modo claro" : "Modo escuro"}</button>
          <button onClick={toggleFullscreen} className="tool">Tela cheia</button>
          <button onClick={toggleWakeLock} className={`tool ${wakeLockOn ? "!bg-eac !text-white" : ""}`}>
            {wakeLockOn ? "✓ Tela acordada" : "Tela acordada"}
          </button>
          <button onClick={generatePdf} disabled={pdfBusy} className="tool">
            {pdfBusy ? "Gerando..." : "Gerar PDF"}
          </button>
          <button onClick={share} className="tool">Compartilhar</button>
        </div>
      )}

      {shareMsg && (
        <div className="mx-4 mt-2 rounded-lg bg-ink text-white text-xs font-semibold px-3 py-2 self-start">
          {shareMsg}
        </div>
      )}

      <div ref={scrollRef} className="chord-scroll mt-4 min-w-0 w-full max-w-full flex-1 overflow-y-auto overflow-x-hidden px-3 pb-28 sm:px-5">
        <div className="w-full max-w-full rounded-[24px] border border-border/80 bg-white px-4 py-5 font-mono leading-[1.9] shadow-[0_6px_24px_rgba(15,27,51,0.05)] sm:px-6" style={{ fontSize }}>
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
                <div key={i} className="whitespace-pre-wrap break-words font-bold text-red max-w-full">
                  {transposeChordLine(line.content, semitones)}
                </div>
              );
            return (
              <div key={i} className="whitespace-pre-wrap break-words text-ink dark:text-[#EAF0F3] max-w-full">
                {line.content}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl min-w-0 items-center gap-3 bg-[#0F1B33] px-4 py-3 text-white shadow-[0_-10px_32px_rgba(15,27,51,0.18)] sm:sticky">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white sm:bg-eac"
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
          className="min-w-0 flex-1 accent-gold"
        />
        <span className="text-[11px] font-semibold text-white/80 sm:text-ink-soft shrink-0">Vel. {SPEED_STEPS[speedIndex]}x</span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-4 py-3 border-t border-border bg-paper-alt dark:bg-dark-surface dark:border-dark-border">
        {usedChordsCurrent.length === 0 && (
          <span className="text-xs text-ink-faint">Nenhum acorde detectado nesta música.</span>
        )}
        {usedChordsCurrent.map((chord, i) => {
          const shape = getChordShape(chord);
          return (
            <div key={`${chord}-${i}`} className="flex flex-col items-center gap-1 shrink-0 w-14">
              {shape ? (
                <div className="rounded border border-ink-faint bg-white text-ink" style={{ height: 52, width: 44 }}>
                  <ChordDiagram shape={shape} />
                </div>
              ) : (
                <div
                  className="rounded border border-dashed border-ink-faint bg-white grid place-items-center text-center text-[8px] text-ink-faint px-0.5"
                  style={{ height: 52, width: 44 }}
                >
                  sem diagrama
                </div>
              )}
              <span className="text-[11px] font-bold">{chord}</span>
            </div>
          );
        })}
      </div>
      <div className="text-center text-[10px] text-ink-faint bg-paper-alt dark:bg-dark-surface pb-3">
        {song.version} · atualizado em {new Date(song.updatedAt).toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}
