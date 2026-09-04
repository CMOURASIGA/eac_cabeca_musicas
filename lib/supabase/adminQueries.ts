"use client";

import { createClient } from "./client";
import type { Collection, SongStatus } from "./database.types";
import type { ExistingSongForDuplicateCheck } from "@/lib/duplicateDetection";

export interface AdminSongRow {
  id: string;
  number: number | null;
  title: string;
  slug: string;
  collection: Collection;
  categoryName: string | null;
  originalKey: string | null;
  status: SongStatus;
  version: number;
  updatedAt: string;
}

export async function fetchAdminSongs(): Promise<AdminSongRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eac_songs")
    .select(
      "id, number, title, slug, collection, original_key, status, version, updated_at, category:eac_song_categories(name)"
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    number: row.number,
    title: row.title,
    slug: row.slug,
    collection: row.collection,
    categoryName: row.category?.name ?? null,
    originalKey: row.original_key,
    status: row.status,
    version: row.version,
    updatedAt: row.updated_at,
  }));
}

export async function fetchAllSongsForDuplicateCheck(): Promise<ExistingSongForDuplicateCheck[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("eac_songs").select("id, slug, number, collection, source_hash");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    slug: r.slug,
    number: r.number,
    collection: r.collection,
    sourceHash: r.source_hash,
  }));
}

export interface CategoryRow {
  id: string;
  name: string;
  collection: Collection;
}

export async function fetchCategoriesAll(): Promise<CategoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eac_song_categories")
    .select("id, name, collection")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export interface SongInput {
  number: number | null;
  title: string;
  slug: string;
  collection: Collection;
  categoryId: string | null;
  originalKey: string | null;
  sourceText: string;
  normalizedLines: unknown;
  status: "DRAFT" | "PUBLISHED";
  sourceFileName: string;
  sourceHash: string;
}

/** Cria uma música nova (nunca usado para sobrescrever uma existente). */
export async function insertSong(input: SongInput): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("eac_songs")
    .insert({
      number: input.number,
      title: input.title,
      slug: input.slug,
      collection: input.collection,
      category_id: input.categoryId,
      original_key: input.originalKey,
      source_text: input.sourceText,
      normalized_lines: input.normalizedLines,
      status: input.status,
      source_type: "MANUAL",
      source_file_name: input.sourceFileName,
      source_hash: input.sourceHash,
      published_at: input.status === "PUBLISHED" ? new Date().toISOString() : null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/**
 * Atualiza uma música já publicada — só é chamada quando o editor marca
 * explicitamente "confirmo substituir" na tela de importação (nunca
 * silenciosamente). Incrementa a versão.
 */
export async function updateExistingSong(id: string, input: SongInput): Promise<void> {
  const supabase = createClient();
  const { data: current, error: fetchErr } = await supabase
    .from("eac_songs")
    .select("version")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;

  const { error } = await supabase
    .from("eac_songs")
    .update({
      number: input.number,
      title: input.title,
      collection: input.collection,
      category_id: input.categoryId,
      original_key: input.originalKey,
      source_text: input.sourceText,
      normalized_lines: input.normalizedLines,
      status: input.status,
      source_file_name: input.sourceFileName,
      source_hash: input.sourceHash,
      version: (current?.version ?? 1) + 1,
      published_at: input.status === "PUBLISHED" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function setSongStatus(id: string, status: SongStatus): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("eac_songs")
    .update({ status, published_at: status === "PUBLISHED" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

// ── rastreabilidade da importação (import_jobs / import_items) ───────────

export async function createImportJob(): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("eac_import_jobs")
    .insert({ source_type: "MANUAL", status: "PROCESSING", created_by: userData.user?.id ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function finishImportJob(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("eac_import_jobs").update({ status: "DONE", finished_at: new Date().toISOString() }).eq("id", id);
}

export interface ImportItemInput {
  importJobId: string;
  fileName: string;
  fileHash: string;
  rawText: string;
  detectedTitle: string | null;
  detectedKey: string | null;
  detectedNumber: number | null;
  detectedChords: string[];
  collection: Collection;
  categoryId: string | null;
  isDuplicate: boolean;
  duplicateSongId: string | null;
  status: "PENDING" | "PUBLISHED" | "DRAFT_SAVED" | "SKIPPED";
  resultingSongId: string | null;
  errorMessage?: string | null;
}

export async function recordImportItem(input: ImportItemInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("eac_import_items").insert({
    import_job_id: input.importJobId,
    file_name: input.fileName,
    file_hash: input.fileHash,
    raw_text: input.rawText,
    detected_title: input.detectedTitle,
    detected_key: input.detectedKey,
    detected_number: input.detectedNumber,
    detected_chords: input.detectedChords,
    collection: input.collection,
    category_id: input.categoryId,
    is_duplicate: input.isDuplicate,
    duplicate_song_id: input.duplicateSongId,
    status: input.status,
    resulting_song_id: input.resultingSongId,
    error_message: input.errorMessage ?? null,
  });
  if (error) throw error;
}
