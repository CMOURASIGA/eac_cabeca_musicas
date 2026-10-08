"use client";

import { createClient } from "./client";
import type { Collection } from "@/lib/sampleData";
import type { UiSong } from "@/lib/uiSong";

const SONG_SELECT =
  "id, number, title, slug, collection, available_for_mass, mass_category_id, original_key, version, updated_at, source_text, category:eac_song_categories(name)";

function mapRow(row: any): UiSong {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    slug: row.slug,
    collection: row.collection,
    category: row.category?.name ?? "Sem categoria",
    availableForMass: Boolean(row.available_for_mass) || row.collection === "MISSA",
    massCategory: null,
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
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function fetchPublishedMassSongs(): Promise<UiSong[]> {
  const supabase = createClient();
  const [{ data: songs, error: songsError }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase
      .from("eac_songs")
      .select("id, number, title, slug, collection, category_id, available_for_mass, mass_category_id, original_key, version, updated_at, source_text")
      .eq("status", "PUBLISHED")
      .or("collection.eq.MISSA,available_for_mass.eq.true")
      .order("title", { ascending: true }),
    supabase
      .from("eac_song_categories")
      .select("id, name, collection")
      .eq("collection", "MISSA")
      .eq("active", true)
      .order("sort_order"),
  ]);

  if (songsError) throw songsError;
  if (categoriesError) throw categoriesError;

  const categoryMap = new Map((categories ?? []).map((c: any) => [String(c.id), String(c.name)]));
  return (songs ?? []).map((row: any) => {
    const categoryId = row.collection === "MISSA" ? row.category_id : row.mass_category_id;
    return {
      id: row.id,
      number: row.number,
      title: row.title,
      slug: row.slug,
      collection: row.collection,
      category: categoryMap.get(String(categoryId || "")) ?? "Sem categoria",
      availableForMass: true,
      massCategory: categoryMap.get(String(categoryId || "")) ?? null,
      originalKey: row.original_key ?? "—",
      version: `v${row.version}`,
      updatedAt: row.updated_at,
      sourceText: row.source_text,
    } satisfies UiSong;
  });
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
