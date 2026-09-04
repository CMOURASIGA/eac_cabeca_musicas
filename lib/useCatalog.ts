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

const QUERY_ERROR_MESSAGE =
  "Não foi possível carregar o catálogo agora. O Supabase está configurado, mas a consulta falhou — " +
  "isso não é modo demonstração, é um erro real (rede, RLS ou configuração). Tente recarregar a página.";

/**
 * Regra importante: dados de exemplo (lib/sampleData.ts) só aparecem quando
 * o Supabase NÃO está configurado (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY
 * ausentes) — isso é "modo demonstração" de propósito. Quando ESTÁ
 * configurado e a consulta falha de verdade, isso nunca vira dado de
 * exemplo silenciosamente: fica um erro visível (`error`), porque mascarar
 * uma falha real de Supabase/RLS como se fosse conteúdo válido esconderia
 * o problema em vez de expor.
 */

export function useCatalog(collection: Collection) {
  const [songs, setSongs] = useState<UiSong[]>(() =>
    isSupabaseConfigured ? [] : SAMPLE_BY_COLLECTION[collection]
  );
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const usingSampleData = !isSupabaseConfigured;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchPublishedSongs(collection), fetchCategories(collection)])
      .then(([songsData, categoriesData]) => {
        if (!alive) return;
        setSongs(songsData);
        setCategories(categoriesData);
      })
      .catch((err) => {
        console.error("Falha real na consulta ao Supabase (não é modo demonstração):", err);
        if (!alive) return;
        setSongs([]);
        setError(QUERY_ERROR_MESSAGE);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [collection]);

  return { songs, categories, loading, usingSampleData, error };
}

export function useAllPublishedSongs() {
  const [songs, setSongs] = useState<UiSong[]>(() => (isSupabaseConfigured ? [] : SAMPLE_ALL));
  const [error, setError] = useState<string | null>(null);
  const usingSampleData = !isSupabaseConfigured;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    fetchAllPublishedSongs()
      .then((data) => {
        if (!alive) return;
        setSongs(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Falha real na consulta ao Supabase (não é modo demonstração):", err);
        if (!alive) return;
        setSongs([]);
        setError(QUERY_ERROR_MESSAGE);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { songs, usingSampleData, error };
}

/** `song === undefined` enquanto carrega, `null` quando não existe/não está publicada (não é erro). */
export function usePublishedSong(slug: string) {
  const sampleFallback = () => SAMPLE_ALL.find((s) => s.slug === slug) ?? null;
  const [song, setSong] = useState<UiSong | null | undefined>(() =>
    isSupabaseConfigured ? undefined : sampleFallback()
  );
  const [error, setError] = useState<string | null>(null);
  const usingSampleData = !isSupabaseConfigured;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    setSong(undefined);
    setError(null);
    fetchPublishedSongBySlug(slug)
      .then((data) => {
        if (!alive) return;
        setSong(data); // null = não encontrada/não publicada, estado legítimo, não é erro
      })
      .catch((err) => {
        console.error("Falha real na consulta ao Supabase (não é modo demonstração):", err);
        if (!alive) return;
        setSong(null);
        setError(QUERY_ERROR_MESSAGE);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  return { song, usingSampleData, error };
}
