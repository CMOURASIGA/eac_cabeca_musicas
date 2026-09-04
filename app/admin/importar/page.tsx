"use client";

import { useEffect, useRef, useState } from "react";
import { parseSongTxt, extractUsedChords } from "@/lib/parseSongTxt";
import { findDuplicateCandidate, type DuplicateCandidate, type ExistingSongForDuplicateCheck } from "@/lib/duplicateDetection";
import { deriveNumberFromFilename, deriveTitleFromFilename } from "@/lib/deriveTitle";
import { slugify } from "@/lib/slug";
import { sha256Hex } from "@/lib/hash";
import type { Collection } from "@/lib/sampleData";
import {
  createImportJob,
  fetchAllSongsForDuplicateCheck,
  fetchCategoriesAll,
  finishImportJob,
  insertSong,
  recordImportItem,
  updateExistingSong,
  type CategoryRow,
} from "@/lib/supabase/adminQueries";

interface ImportRow {
  localId: string;
  file: File;
  rawText: string;
  fileHash: string;
  title: string;
  number: number | null;
  originalKey: string | null;
  ambiguousKey: boolean;
  chords: string[];
  collection: Collection;
  categoryId: string | null;
  duplicate: DuplicateCandidate | null;
  confirmOverwrite: boolean;
  targetStatus: "DRAFT" | "PUBLISHED";
  result: "idle" | "saving" | "done" | "error" | "skipped";
  resultMessage?: string;
}

export default function AdminImportarPage() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [existingSongs, setExistingSongs] = useState<ExistingSongForDuplicateCheck[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([fetchAllSongsForDuplicateCheck(), fetchCategoriesAll()])
      .then(([songs, cats]) => {
        setExistingSongs(songs);
        setCategories(cats);
      })
      .catch((err) => setLoadError(err.message ?? "Falha ao carregar dados do catálogo."));
  }, []);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setLoadError(null);
    const files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith(".txt"));
    const newRows: ImportRow[] = [];

    for (const file of files) {
      const rawText = await file.text();
      const fileHash = await sha256Hex(rawText);
      const { frontMatter, lines } = parseSongTxt(rawText);

      const title = frontMatter.title?.trim() || deriveTitleFromFilename(file.name);
      const number = frontMatter.number ? Number(frontMatter.number) : deriveNumberFromFilename(file.name);
      const originalKey = frontMatter.key?.trim() || null;
      const collection: Collection = frontMatter.collection?.toUpperCase() === "MISSA" ? "MISSA" : "EAC";
      const chords = extractUsedChords(lines);

      const duplicate = findDuplicateCandidate({ title, number, collection, sourceHash: fileHash }, existingSongs);

      newRows.push({
        localId: crypto.randomUUID(),
        file,
        rawText,
        fileHash,
        title,
        number,
        originalKey,
        ambiguousKey: !originalKey,
        chords,
        collection,
        categoryId: null,
        duplicate,
        confirmOverwrite: false,
        targetStatus: "DRAFT",
        result: "idle",
      });
    }

    setRows((prev) => [...prev, ...newRows]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateRow(localId: string, patch: Partial<ImportRow>) {
    setRows((prev) => prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)));
  }

  function removeRow(localId: string) {
    setRows((prev) => prev.filter((r) => r.localId !== localId));
  }

  async function processBatch() {
    if (!rows.length) return;
    setProcessing(true);
    const jobId = await createImportJob().catch((err) => {
      setLoadError(err.message ?? "Falha ao iniciar o job de importação.");
      return null;
    });
    if (!jobId) {
      setProcessing(false);
      return;
    }

    for (const row of rows) {
      if (row.result === "done" || row.result === "skipped") continue;

      const blockedByDuplicate = row.duplicate && !row.confirmOverwrite;
      updateRow(row.localId, { result: "saving" });

      if (blockedByDuplicate) {
        await recordImportItem({
          importJobId: jobId,
          fileName: row.file.name,
          fileHash: row.fileHash,
          rawText: row.rawText,
          detectedTitle: row.title,
          detectedKey: row.originalKey,
          detectedNumber: row.number,
          detectedChords: row.chords,
          collection: row.collection,
          categoryId: row.categoryId,
          isDuplicate: true,
          duplicateSongId: row.duplicate!.id,
          status: "SKIPPED",
          resultingSongId: null,
        }).catch(() => {});
        updateRow(row.localId, {
          result: "skipped",
          resultMessage: "Duplicidade não confirmada — nada foi sobrescrito.",
        });
        continue;
      }

      try {
        const parsed = parseSongTxt(row.rawText);
        const slug = slugify(row.title);
        const songInput = {
          number: row.number,
          title: row.title,
          slug,
          collection: row.collection,
          categoryId: row.categoryId,
          originalKey: row.originalKey,
          sourceText: row.rawText,
          normalizedLines: parsed.lines,
          status: row.targetStatus,
          sourceFileName: row.file.name,
          sourceHash: row.fileHash,
        };

        let resultingSongId: string;
        if (row.duplicate && row.confirmOverwrite) {
          resultingSongId = row.duplicate.id;
          await updateExistingSong(row.duplicate.id, songInput);
        } else {
          resultingSongId = await insertSong(songInput);
        }

        await recordImportItem({
          importJobId: jobId,
          fileName: row.file.name,
          fileHash: row.fileHash,
          rawText: row.rawText,
          detectedTitle: row.title,
          detectedKey: row.originalKey,
          detectedNumber: row.number,
          detectedChords: row.chords,
          collection: row.collection,
          categoryId: row.categoryId,
          isDuplicate: Boolean(row.duplicate),
          duplicateSongId: row.duplicate?.id ?? null,
          status: row.targetStatus === "PUBLISHED" ? "PUBLISHED" : "DRAFT_SAVED",
          resultingSongId,
        }).catch(() => {});

        updateRow(row.localId, {
          result: "done",
          resultMessage: row.targetStatus === "PUBLISHED" ? "Publicado." : "Salvo como rascunho.",
        });
      } catch (err: any) {
        await recordImportItem({
          importJobId: jobId,
          fileName: row.file.name,
          fileHash: row.fileHash,
          rawText: row.rawText,
          detectedTitle: row.title,
          detectedKey: row.originalKey,
          detectedNumber: row.number,
          detectedChords: row.chords,
          collection: row.collection,
          categoryId: row.categoryId,
          isDuplicate: Boolean(row.duplicate),
          duplicateSongId: row.duplicate?.id ?? null,
          status: "PENDING",
          resultingSongId: null,
          errorMessage: err.message,
        }).catch(() => {});
        updateRow(row.localId, { result: "error", resultMessage: err.message ?? "Falha ao salvar." });
      }
    }

    await finishImportJob(jobId).catch(() => {});
    setExistingSongs(await fetchAllSongsForDuplicateCheck().catch(() => existingSongs));
    setProcessing(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-xl font-semibold">Importar TXT</h1>
        <p className="text-sm text-ink-soft">
          Upload de um ou vários arquivos .txt. Nada é publicado sem revisão — confira o preview
          abaixo antes de processar o lote.
        </p>
      </div>

      {loadError && <p className="text-sm text-red font-semibold">{loadError}</p>}

      <label className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-white p-8 text-center cursor-pointer">
        <span className="text-sm font-bold">Arraste arquivos .txt aqui ou clique para selecionar</span>
        <span className="text-xs text-ink-soft">Múltiplos arquivos, UTF-8. Aceita os 41 TXT legados sem front matter.</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {!!rows.length && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{rows.length} arquivo(s) no lote</p>
            <button
              onClick={processBatch}
              disabled={processing}
              className="rounded-lg bg-eac px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {processing ? "Processando..." : "Processar lote"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-faint border-b border-border">
                  <th className="px-3 py-2.5">Arquivo</th>
                  <th className="px-3 py-2.5">Título</th>
                  <th className="px-3 py-2.5">Tom</th>
                  <th className="px-3 py-2.5">Acordes</th>
                  <th className="px-3 py-2.5">Coleção</th>
                  <th className="px-3 py-2.5">Categoria</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Publicar?</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rowCategories = categories.filter((c) => c.collection === row.collection);
                  return (
                    <tr key={row.localId} className="border-b border-border last:border-0 align-top">
                      <td className="px-3 py-2.5 font-mono text-xs text-ink-soft max-w-[140px] truncate">
                        {row.file.name}
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          value={row.title}
                          onChange={(e) => updateRow(row.localId, { title: e.target.value })}
                          className="w-40 rounded border border-border px-2 py-1 text-xs"
                        />
                        {row.number != null && <div className="text-[10px] text-ink-faint mt-0.5">Nº {row.number}</div>}
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          value={row.originalKey ?? ""}
                          onChange={(e) => updateRow(row.localId, { originalKey: e.target.value || null, ambiguousKey: !e.target.value })}
                          placeholder="?"
                          className="w-14 rounded border border-border px-2 py-1 text-xs"
                        />
                        {row.ambiguousKey && <div className="text-[10px] text-amber-700 mt-0.5">ambíguo</div>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {row.chords.length ? (
                            row.chords.map((c) => (
                              <span key={c} className="rounded bg-paper-alt px-1.5 py-0.5 font-mono text-[10px]">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-ink-faint">nenhum</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={row.collection}
                          onChange={(e) =>
                            updateRow(row.localId, { collection: e.target.value as Collection, categoryId: null })
                          }
                          className="rounded border border-border px-2 py-1 text-xs"
                        >
                          <option value="EAC">Livro EAC</option>
                          <option value="MISSA">Missa</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={row.categoryId ?? ""}
                          onChange={(e) => updateRow(row.localId, { categoryId: e.target.value || null })}
                          className="rounded border border-border px-2 py-1 text-xs"
                        >
                          <option value="">Sem categoria</option>
                          {rowCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        {row.duplicate ? (
                          <div className="space-y-1">
                            <span className="block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              Possível duplicidade ({row.duplicate.reason === "same-hash" ? "conteúdo idêntico" : row.duplicate.reason === "same-slug" ? "mesmo título" : "mesmo número"})
                            </span>
                            <label className="flex items-center gap-1.5 text-[10px]">
                              <input
                                type="checkbox"
                                checked={row.confirmOverwrite}
                                onChange={(e) => updateRow(row.localId, { confirmOverwrite: e.target.checked })}
                              />
                              Confirmo substituir a existente
                            </label>
                          </div>
                        ) : (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-800">
                            Sem duplicidade
                          </span>
                        )}
                        {row.result !== "idle" && (
                          <div
                            className={`mt-1 text-[10px] font-semibold ${
                              row.result === "error" ? "text-red" : "text-ink-soft"
                            }`}
                          >
                            {row.result === "saving" ? "Salvando..." : row.resultMessage}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={row.targetStatus}
                          onChange={(e) => updateRow(row.localId, { targetStatus: e.target.value as "DRAFT" | "PUBLISHED" })}
                          className="rounded border border-border px-2 py-1 text-xs"
                        >
                          <option value="DRAFT">Rascunho</option>
                          <option value="PUBLISHED">Publicar</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeRow(row.localId)} className="text-xs font-bold text-red">
                          Remover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
