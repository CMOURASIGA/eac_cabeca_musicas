-- Livro de Músicas EAC — schema inicial (Fase 1: base + importação de TXT)
--
-- SEGURO PARA RODAR EM UM PROJETO SUPABASE JÁ EXISTENTE COM OUTROS DADOS:
-- só cria objetos novos (extensões, tipos, tabelas, índices, funções,
-- triggers e políticas de RLS com nomes específicos deste app). Nada aqui
-- faz DROP, ALTER ou TRUNCATE em qualquer tabela pré-existente. Se algum
-- nome abaixo já existir no seu projeto por outro motivo, o statement
-- correspondente falha (não sobrescreve) — nesse caso pare e me avise
-- qual nome colidiu antes de tentar de novo.
--
-- Rode este arquivo inteiro no SQL Editor do painel Supabase, na ordem em
-- que aparece (é uma transação implícita: se algo falhar no meio, nada
-- desse arquivo fica aplicado).

begin;

-- ── extensões ────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists unaccent;   -- busca ignorando acentos
create extension if not exists pg_trgm;    -- busca por trecho (ILIKE/trigram)

-- ── tipos ────────────────────────────────────────────────────────────────
do $$ begin
  create type public.eac_collection as enum ('EAC', 'MISSA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.eac_song_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.eac_source_type as enum ('MANUAL', 'DRIVE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.eac_user_role as enum ('EDITOR', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.eac_import_status as enum ('PENDING', 'PROCESSING', 'DONE', 'FAILED');
exception when duplicate_object then null; end $$;

-- ── função utilitária: updated_at automático ────────────────────────────
create or replace function public.eac_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles (mapeia auth.users -> papel Editor/Admin) ──────────────────
-- Não existe cadastro público: só o Admin cria contas (Supabase Auth
-- Dashboard) e cada conta nova vira EDITOR por padrão via trigger abaixo.
-- Promover alguém a ADMIN é manual:
--   update public.eac_profiles set role = 'ADMIN' where id = '<uuid do usuário>';
create table if not exists public.eac_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.eac_user_role not null default 'EDITOR',
  full_name text,
  created_at timestamptz not null default now()
);

create or replace function public.eac_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.eac_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists eac_on_auth_user_created on auth.users;
create trigger eac_on_auth_user_created
  after insert on auth.users
  for each row execute function public.eac_handle_new_user();

-- funções de apoio para as políticas de RLS
create or replace function public.eac_is_editor_or_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.eac_profiles
    where id = auth.uid() and role in ('EDITOR', 'ADMIN')
  );
$$;

create or replace function public.eac_is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.eac_profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ── song_categories ──────────────────────────────────────────────────────
create table if not exists public.eac_song_categories (
  id uuid primary key default gen_random_uuid(),
  collection public.eac_collection not null,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (collection, slug)
);

-- ── songs ────────────────────────────────────────────────────────────────
create table if not exists public.eac_songs (
  id uuid primary key default gen_random_uuid(),
  number int,
  title text not null,
  slug text not null unique,
  collection public.eac_collection not null,
  category_id uuid references public.eac_song_categories (id),
  original_key text,
  source_text text not null,
  normalized_lines jsonb,
  status public.eac_song_status not null default 'DRAFT',
  source_type public.eac_source_type not null default 'MANUAL',
  source_file_name text,
  source_file_id text,
  source_hash text,
  version int not null default 1,
  published_at timestamptz,
  created_by uuid references public.eac_profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text
);

-- search_text não pode ser "generated always as" porque unaccent() não é
-- IMMUTABLE (depende da configuração de busca textual) — o Postgres recusa
-- esse uso em coluna gerada. Um trigger resolve igual, sem essa exigência.
create or replace function public.eac_songs_set_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text = lower(unaccent(coalesce(new.title, '') || ' ' || coalesce(new.source_text, '')));
  return new;
end;
$$;

drop trigger if exists eac_songs_set_search_text on public.eac_songs;
create trigger eac_songs_set_search_text
  before insert or update on public.eac_songs
  for each row execute function public.eac_songs_set_search_text();

drop trigger if exists eac_songs_set_updated_at on public.eac_songs;
create trigger eac_songs_set_updated_at
  before update on public.eac_songs
  for each row execute function public.eac_set_updated_at();

create index if not exists eac_songs_search_trgm_idx
  on public.eac_songs using gin (search_text gin_trgm_ops);
create index if not exists eac_songs_collection_status_idx
  on public.eac_songs (collection, status);
create index if not exists eac_songs_number_idx on public.eac_songs (number);

-- ── repertoires / repertoire_songs (schema já criado; UI entra na Fase 2) ─
create table if not exists public.eac_repertoires (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  collection public.eac_collection,
  event_date date,
  status text not null default 'DRAFT',
  created_by uuid references public.eac_profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.eac_repertoire_songs (
  repertoire_id uuid not null references public.eac_repertoires (id) on delete cascade,
  song_id uuid not null references public.eac_songs (id) on delete cascade,
  sort_order int not null default 0,
  target_key text,
  notes text,
  primary key (repertoire_id, song_id)
);

-- ── chord_diagrams ───────────────────────────────────────────────────────
create table if not exists public.eac_chord_diagrams (
  id uuid primary key default gen_random_uuid(),
  chord_key text not null,
  instrument text not null default 'violao',
  shape_json jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (chord_key, instrument)
);

-- ── import_jobs / import_items (rastreabilidade da importação de TXT) ────
create table if not exists public.eac_import_jobs (
  id uuid primary key default gen_random_uuid(),
  source_type public.eac_source_type not null default 'MANUAL',
  status public.eac_import_status not null default 'PENDING',
  created_by uuid references public.eac_profiles (id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.eac_import_items (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.eac_import_jobs (id) on delete cascade,
  file_name text not null,
  file_hash text,
  raw_text text not null,
  detected_title text,
  detected_key text,
  detected_number int,
  detected_chords text[],
  collection public.eac_collection not null default 'EAC',
  category_id uuid references public.eac_song_categories (id),
  is_duplicate boolean not null default false,
  duplicate_song_id uuid references public.eac_songs (id),
  status text not null default 'PENDING', -- PENDING | PUBLISHED | DRAFT_SAVED | SKIPPED
  resulting_song_id uuid references public.eac_songs (id),
  error_message text,
  created_at timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.eac_profiles enable row level security;
alter table public.eac_song_categories enable row level security;
alter table public.eac_songs enable row level security;
alter table public.eac_repertoires enable row level security;
alter table public.eac_repertoire_songs enable row level security;
alter table public.eac_chord_diagrams enable row level security;
alter table public.eac_import_jobs enable row level security;
alter table public.eac_import_items enable row level security;

-- profiles: cada usuário vê o próprio perfil; admin vê/edita todos
drop policy if exists eac_profiles_select_own_or_admin on public.eac_profiles;
create policy eac_profiles_select_own_or_admin on public.eac_profiles
  for select using (id = auth.uid() or public.eac_is_admin());

drop policy if exists eac_profiles_update_admin on public.eac_profiles;
create policy eac_profiles_update_admin on public.eac_profiles
  for update using (public.eac_is_admin());

-- song_categories: leitura pública das ativas; escrita só editor/admin
drop policy if exists eac_categories_select_public on public.eac_song_categories;
create policy eac_categories_select_public on public.eac_song_categories
  for select using (active or public.eac_is_editor_or_admin());

drop policy if exists eac_categories_write_editor on public.eac_song_categories;
create policy eac_categories_write_editor on public.eac_song_categories
  for all using (public.eac_is_editor_or_admin())
  with check (public.eac_is_editor_or_admin());

-- songs: leitura pública só do que está PUBLISHED; editor/admin vê tudo
drop policy if exists eac_songs_select_public on public.eac_songs;
create policy eac_songs_select_public on public.eac_songs
  for select using (status = 'PUBLISHED' or public.eac_is_editor_or_admin());

drop policy if exists eac_songs_write_editor on public.eac_songs;
create policy eac_songs_write_editor on public.eac_songs
  for all using (public.eac_is_editor_or_admin())
  with check (public.eac_is_editor_or_admin());

-- repertoires: leitura pública só do que está PUBLISHED; resto editor/admin
drop policy if exists eac_repertoires_select_public on public.eac_repertoires;
create policy eac_repertoires_select_public on public.eac_repertoires
  for select using (status = 'PUBLISHED' or public.eac_is_editor_or_admin());

drop policy if exists eac_repertoires_write_editor on public.eac_repertoires;
create policy eac_repertoires_write_editor on public.eac_repertoires
  for all using (public.eac_is_editor_or_admin())
  with check (public.eac_is_editor_or_admin());

drop policy if exists eac_repertoire_songs_select_public on public.eac_repertoire_songs;
create policy eac_repertoire_songs_select_public on public.eac_repertoire_songs
  for select using (
    public.eac_is_editor_or_admin()
    or exists (
      select 1 from public.eac_repertoires r
      where r.id = repertoire_id and r.status = 'PUBLISHED'
    )
  );

drop policy if exists eac_repertoire_songs_write_editor on public.eac_repertoire_songs;
create policy eac_repertoire_songs_write_editor on public.eac_repertoire_songs
  for all using (public.eac_is_editor_or_admin())
  with check (public.eac_is_editor_or_admin());

-- chord_diagrams: leitura pública dos ativos; escrita editor/admin
drop policy if exists eac_chord_diagrams_select_public on public.eac_chord_diagrams;
create policy eac_chord_diagrams_select_public on public.eac_chord_diagrams
  for select using (active or public.eac_is_editor_or_admin());

drop policy if exists eac_chord_diagrams_write_editor on public.eac_chord_diagrams;
create policy eac_chord_diagrams_write_editor on public.eac_chord_diagrams
  for all using (public.eac_is_editor_or_admin())
  with check (public.eac_is_editor_or_admin());

-- import_jobs / import_items: 100% interno, nunca público
drop policy if exists eac_import_jobs_editor on public.eac_import_jobs;
create policy eac_import_jobs_editor on public.eac_import_jobs
  for all using (public.eac_is_editor_or_admin())
  with check (public.eac_is_editor_or_admin());

drop policy if exists eac_import_items_editor on public.eac_import_items;
create policy eac_import_items_editor on public.eac_import_items
  for all using (public.eac_is_editor_or_admin())
  with check (public.eac_is_editor_or_admin());

commit;
