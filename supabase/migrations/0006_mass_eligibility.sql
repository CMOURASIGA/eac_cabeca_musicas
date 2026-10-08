-- Livro EAC / Missa — música de origem EAC também pode ser disponibilizada para uso litúrgico.
-- Mantém as coleções separadas: collection continua indicando onde a música nasceu/é mantida.
-- available_for_mass apenas permite que uma música EAC também apareça no catálogo de Missa.

begin;

alter table public.eac_songs
  add column if not exists available_for_mass boolean not null default false,
  add column if not exists mass_category_id uuid references public.eac_song_categories (id);

-- Toda música cuja coleção principal já é MISSA naturalmente está disponível no catálogo litúrgico.
update public.eac_songs
set available_for_mass = true
where collection = 'MISSA'
  and available_for_mass is distinct from true;

create index if not exists eac_songs_mass_catalog_idx
  on public.eac_songs (available_for_mass, status);

create index if not exists eac_songs_mass_category_idx
  on public.eac_songs (mass_category_id);

comment on column public.eac_songs.available_for_mass is
  'Permite que música cuja coleção principal é EAC também apareça no catálogo de Missa.';
comment on column public.eac_songs.mass_category_id is
  'Categoria litúrgica usada quando a música é disponibilizada no catálogo de Missa.';

commit;
