"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "./supabase/env";
import {
  fetchAllPublishedSongs,
  fetchCategories,
  fetchPublishedSongBySlug,
  fetchPublishedSongs,
  type CategoryOption,
} from "./supabase/publicQueries";
import { EAC_SONGS, MISSA_SONGS, type Collection } from "./sampleData";
import { sampleSongToUiSong, type UiSong } from "./uiSong";

const SAMPLE_BY_COLLECTION: Record<Collection, UiSong[]> = {
  EAC: EAC_SONGS.map(sampleSongToUiSong),
  MISSA: MISSA_SONGS.map(sampleSongToUiSong),
};
const SAMPLE_ALL = [...SAMPLE_BY_COLLECTION.EAC, ...SAMPLE_BY_COLLECTION.MISSA];

/**
 * Todos os hooks abaixo seguem o mesmo padrão: se o Supabase estiver
 * configurado, buscam de verdade (RLS já filtra para PUBLISHED); se não
 * estiver configurado, ou se a busca falhar, caem para lib/sampleData.ts
 * com um aviso — nunca quebram a tela, só avisam que é modo demonstração.
 */

export function useCatalog(collection: Collection) {
  const [songs, setSongs] = useState<UiSong[]>(() =>
    isSupabaseConfigured ? [] : SAMPLE_BY_COLLECTION[collection]
  );
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingSampleData, setUsingSampleData] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    setLoading(true);
    Promise.all([fetchPublishedSongs(collection), fetchCategories(collection)])
      .then(([songsData, categoriesData]) => {
        if (!alive) return;
        setSongs(songsData);
        setCategories(categoriesData);
        setUsingSampleData(false);
      })
      .catch((err) => {
        console.error("Supabase indisponível, usando catálogo de exemplo:", err);
        if (!alive) return;
        setSongs(SAMPLE_BY_COLLECTION[collection]);
        setUsingSampleData(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [collection]);

  return { songs, categories, loading, usingSampleData };
}

export function useAllPublishedSongs() {
  const [songs, setSongs] = useState<UiSong[]>(() => (isSupabaseConfigured ? [] : SAMPLE_ALL));
  const [usingSampleData, setUsingSampleData] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    fetchAllPublishedSongs()
      .then((data) => {
        if (!alive) return;
        setSongs(data);
        setUsingSampleData(false);
      })
      .catch(() => {
        if (!alive) return;
        setSongs(SAMPLE_ALL);
        setUsingSampleData(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { songs, usingSampleData };
}

/** `song === undefined` enquanto carrega, `null` quando não existe/não está publicada. */
export function usePublishedSong(slug: string) {
  const sampleFallback = () => SAMPLE_ALL.find((s) => s.slug === slug) ?? null;
  const [song, setSong] = useState<UiSong | null | undefined>(() =>
    isSupabaseConfigured ? undefined : sampleFallback()
  );
  const [usingSampleData, setUsingSampleData] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    setSong(undefined);
    fetchPublishedSongBySlug(slug)
      .then((data) => {
        if (!alive) return;
        if (data) {
          setSong(data);
          setUsingSampleData(false);
        } else {
          setSong(sampleFallback());
          setUsingSampleData(true);
        }
      })
      .catch(() => {
        if (!alive) return;
        setSong(sampleFallback());
        setUsingSampleData(true);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  return { song, usingSampleData };
}
