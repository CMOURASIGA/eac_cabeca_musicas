import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "@/lib/supabase/env";
import { EAC_SONGS, MISSA_SONGS } from "@/lib/sampleData";
import { sampleSongToUiSong, type UiSong } from "@/lib/uiSong";

/**
 * Busca de músicas para geração de PDF, do lado do servidor (rota de API,
 * runtime Node — sem cookies de sessão, só leitura pública).
 *
 * Mesma regra do resto do app: com Supabase configurado, só músicas
 * PUBLISHED (a RLS pública garante isso; o filtro aqui é redundante e
 * intencional). Sem Supabase configurado, cai no mesmo catálogo de exemplo
 * usado no modo demonstração do restante da UI — nunca inventa conteúdo.
 */
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

const SAMPLE_ALL: UiSong[] = [...EAC_SONGS, ...MISSA_SONGS].map(sampleSongToUiSong);

/** Busca várias músicas por slug, preservando a ordem pedida (ordem do repertório/seleção). */
export async function fetchSongsForPdfBySlug(slugs: string[]): Promise<UiSong[]> {
  if (!slugs.length) return [];

  let bySlug: Map<string, UiSong>;

  if (!isSupabaseConfigured) {
    bySlug = new Map(SAMPLE_ALL.map((s) => [s.slug, s]));
  } else {
    const supabase = createSupabaseClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const { data, error } = await supabase
      .from("eac_songs")
      .select(SONG_SELECT)
      .in("slug", slugs)
      .eq("status", "PUBLISHED");
    if (error) throw error;
    bySlug = new Map((data ?? []).map((row: any) => [row.slug, mapRow(row)]));
  }

  return slugs.map((slug) => bySlug.get(slug)).filter((s): s is UiSong => Boolean(s));
}
