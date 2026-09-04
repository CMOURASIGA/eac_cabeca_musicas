/**
 * Tipos manuais equivalentes ao schema de supabase/migrations/*.sql.
 * Quando o projeto estiver plugado, o ideal é gerar isto de verdade com
 * `supabase gen types typescript` e substituir este arquivo.
 */
export type Collection = "EAC" | "MISSA";
export type SongStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type SourceType = "MANUAL" | "DRIVE";
export type UserRole = "EDITOR" | "ADMIN";
export type ImportStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export interface EacSongRow {
  id: string;
  number: number | null;
  title: string;
  slug: string;
  collection: Collection;
  category_id: string | null;
  original_key: string | null;
  source_text: string;
  normalized_lines: unknown;
  status: SongStatus;
  source_type: SourceType;
  source_file_name: string | null;
  source_file_id: string | null;
  source_hash: string | null;
  version: number;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EacSongCategoryRow {
  id: string;
  collection: Collection;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
}

export interface EacProfileRow {
  id: string;
  role: UserRole;
  full_name: string | null;
}

export interface EacImportJobRow {
  id: string;
  source_type: SourceType;
  status: ImportStatus;
  created_by: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface EacImportItemRow {
  id: string;
  import_job_id: string;
  file_name: string;
  file_hash: string | null;
  raw_text: string;
  detected_title: string | null;
  detected_key: string | null;
  detected_number: number | null;
  detected_chords: string[] | null;
  collection: Collection;
  category_id: string | null;
  is_duplicate: boolean;
  duplicate_song_id: string | null;
  status: "PENDING" | "PUBLISHED" | "DRAFT_SAVED" | "SKIPPED";
  resulting_song_id: string | null;
  error_message: string | null;
  created_at: string;
}
