"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchAdminSongs, setSongStatus, type AdminSongRow } from "@/lib/supabase/adminQueries";
import type { SongStatus } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<SongStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

const STATUS_CLASS: Record<SongStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-paper-alt text-ink-faint",
};

export default function AdminMusicasPage() {
  const [songs, setSongs] = useState<AdminSongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<"TODAS" | "EAC" | "MISSA">("TODAS");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | SongStatus>("TODOS");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setSongs(await fetchAdminSongs());
    } catch (err: any) {
      setError(err.message ?? "Falha ao carregar músicas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      songs.filter(
        (s) =>
          (collectionFilter === "TODAS" || s.collection === collectionFilter) &&
          (statusFilter === "TODOS" || s.status === statusFilter)
      ),
    [songs, collectionFilter, statusFilter]
  );

  async function changeStatus(id: string, status: SongStatus) {
    await setSongStatus(id, status);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl font-semibold">Músicas</h1>
          <p className="text-sm text-ink-soft">{songs.length} registro(s) · Livro EAC e Missa</p>
        </div>
        <Link href="/admin/importar" className="rounded-lg bg-eac px-4 py-2 text-sm font-bold text-white">
          + Importar TXT
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["TODAS", "EAC", "MISSA"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCollectionFilter(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              collectionFilter === c ? "bg-ink text-white border-ink" : "border-border text-ink-soft"
            }`}
          >
            {c === "TODAS" ? "Todas" : c === "EAC" ? "Livro EAC" : "Missa"}
          </button>
        ))}
        {(["TODOS", "PUBLISHED", "DRAFT", "ARCHIVED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              statusFilter === s ? "bg-ink text-white border-ink" : "border-border text-ink-soft"
            }`}
          >
            {s === "TODOS" ? "Todos os status" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red font-semibold">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Carregando...</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-faint border-b border-border">
                <th className="px-4 py-2.5">Nº</th>
                <th className="px-4 py-2.5">Título</th>
                <th className="px-4 py-2.5">Coleção</th>
                <th className="px-4 py-2.5">Categoria</th>
                <th className="px-4 py-2.5">Tom</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Atualizado</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-mono text-ink-faint">{s.number ?? "—"}</td>
                  <td className="px-4 py-2.5 font-semibold">{s.title}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                        s.collection === "EAC" ? "bg-eac-soft text-eac" : "bg-missa-soft text-missa"
                      }`}
                    >
                      {s.collection === "EAC" ? "Livro EAC" : "Missa"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{s.categoryName ?? "—"}</td>
                  <td className="px-4 py-2.5">{s.originalKey ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${STATUS_CLASS[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    {new Date(s.updatedAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2.5 space-x-2 whitespace-nowrap">
                    {s.status !== "PUBLISHED" && (
                      <button onClick={() => changeStatus(s.id, "PUBLISHED")} className="text-xs font-bold text-eac">
                        Publicar
                      </button>
                    )}
                    {s.status !== "DRAFT" && (
                      <button onClick={() => changeStatus(s.id, "DRAFT")} className="text-xs font-bold text-ink-soft">
                        Rascunho
                      </button>
                    )}
                    {s.status !== "ARCHIVED" && (
                      <button onClick={() => changeStatus(s.id, "ARCHIVED")} className="text-xs font-bold text-red">
                        Arquivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-ink-soft">
                    Nenhuma música com esse filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
