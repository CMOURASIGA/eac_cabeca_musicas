import type { Collection, SampleSong } from "./sampleData";

/** Formato único de música usado pela UI, venha do Supabase ou do fallback de exemplo. */
export interface UiSong {
  id: string;
  number: number | null;
  title: string;
  slug: string;
  collection: Collection;
  category: string;
  originalKey: string;
  version: string;
  updatedAt: string;
  sourceText: string;
}

export function sampleSongToUiSong(s: SampleSong): UiSong {
  return {
    id: s.id,
    number: s.number,
    title: s.title,
    slug: s.slug,
    collection: s.collection,
    category: s.category,
    originalKey: s.originalKey,
    version: s.version,
    updatedAt: s.updatedAt,
    sourceText: s.txt,
  };
}
