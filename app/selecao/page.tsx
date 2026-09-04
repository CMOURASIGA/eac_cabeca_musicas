"use client";

import Link from "next/link";
import { useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import { useLocalStorageSet } from "@/lib/useLocalStorageSet";
import { useAllPublishedSongs } from "@/lib/useCatalog";

export default function SelecaoPage() {
  const selection = useLocalStorageSet("eac:selection");
  const { songs: allSongs, usingSampleData } = useAllPublishedSongs();
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);
  const songs = selection.ids.map((id) => allSongs.find((s) => s.id === id)).filter((s): s is (typeof allSongs)[number] => Boolean(s));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      <div>
        <h1 className="font-serif text-xl font-semibold">Sua seleção</h1>
        <p className="text-sm text-ink-soft">
          Seleção temporária, salva neste aparelho. Repertórios oficiais persistidos pelo
          editor/admin chegam na Fase 2.
        </p>
      </div>

      {usingSampleData && <DemoBanner />}

      {!songs.length && (
        <p className="text-sm text-ink-soft rounded-xl border border-dashed border-border p-4">
          Nenhuma música na seleção ainda. Abra uma música e toque em "+ Seleção".
        </p>
      )}

      <div className="space-y-2">
        {songs.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5">
            <span className="text-xs font-bold text-ink-faint w-5">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{s.title}</div>
              <div className="text-xs text-ink-soft">
                {s.collection === "EAC" ? "Livro EAC" : "Missa"} · Tom {s.originalKey}
              </div>
            </div>
            <button
              onClick={() => selection.toggle(s.id)}
              className="text-xs font-semibold text-red shrink-0"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      {!!songs.length && (
        <div className="rounded-xl border border-border bg-white p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-faint">Opções do PDF</div>
          <p className="text-xs text-ink-soft">
            Cifras, diagramas, capa e tamanho de fonte serão configuráveis aqui na Fase 2, quando a
            geração de PDF server-side entrar. Por ora, a seleção já pode ser montada e reordenada.
          </p>
          <button
            onClick={() => {
              setPdfMsg("Geração de PDF ainda não implementada — chega na Fase 2 do projeto.");
              setTimeout(() => setPdfMsg(null), 3000);
            }}
            className="w-full rounded-xl bg-eac py-3 text-sm font-bold text-white"
          >
            Gerar PDF do repertório
          </button>
          {pdfMsg && <p className="text-xs text-ink-soft">{pdfMsg}</p>}
        </div>
      )}

      <Link href="/livro-eac" className="inline-block text-sm font-semibold text-eac">
        ← Continuar navegando no Livro EAC
      </Link>
    </div>
  );
}
