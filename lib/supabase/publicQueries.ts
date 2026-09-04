"use client";

import { createClient } from "./client";
import type { Collection } from "@/lib/sampleData";
import type { UiSong } from "@/lib/uiSong";

const SONG_SELECT =
  "id, number, title, slug, collection, original_key, version, updated_at, source_text, category:eac_song_categories(name)";

function mapRow(row: any): UiSong {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    slug: row.slug,
    collection: row.collection,
    category: row.category?.name ?? "Sem categoria",
    originalKey: row.original_key ?? "—",
    version: `v${row.version}`,
    updatedAt: row.updated_at,
    sourceText: row.source_text,
  };
}

/** Só músicas PUBLISHED — a RLS pública já garante isso, este filtro é redundante e intencional. */
export async function fetchPublishedSongs(collection: Collection): Promise<UiSong[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eac_songs")
    .select(SONG_SELECT)
    .eq("collection", collection)
    .eq("status", "PUBLISHED")
    .order("number", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function fetchAllPublishedSongs(): Promise<UiSong[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eac_songs")
    .select(SONG_SELECT)
    .eq("status", "PUBLISHED");
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function fetchPublishedSongBySlug(slug: string): Promise<UiSong | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eac_songs")
    .select(SONG_SELECT)
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export async function fetchCategories(collection: Collection): Promise<CategoryOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eac_song_categories")
    .select("id, name, slug")
    .eq("collection", collection)
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}
