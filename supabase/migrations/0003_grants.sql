-- GRANTs explícitos para as tabelas do app nas roles padrão do Supabase
-- (anon, authenticated). A RLS de cada tabela continua sendo quem decide
-- o que cada usuário realmente enxerga/edita — GRANT só abre a porta para
-- a RLS ser avaliada; sem GRANT, o Postgres nem chega a checar a política
-- e responde "permission denied for table X" direto, que foi o erro visto
-- na tela de importação.
--
-- Seguro rodar num projeto existente: GRANT é sempre aditivo/idempotente,
-- nunca remove nada.

begin;

grant usage on schema public to anon, authenticated;

-- leitura pública (RLS decide status published/ativo por linha)
grant select on
  public.eac_songs,
  public.eac_song_categories,
  public.eac_repertoires,
  public.eac_repertoire_songs,
  public.eac_chord_diagrams
to anon, authenticated;

-- escrita só para authenticated (RLS ainda exige papel EDITOR/ADMIN)
grant insert, update, delete on
  public.eac_songs,
  public.eac_song_categories,
  public.eac_repertoires,
  public.eac_repertoire_songs,
  public.eac_chord_diagrams
to authenticated;

-- importação: 100% interno, nunca público
grant select, insert, update, delete on
  public.eac_import_jobs,
  public.eac_import_items
to authenticated;

-- perfis: leitura do próprio (ou tudo se admin, via RLS); update só admin (RLS)
-- nunca insert direto — isso é feito pelo trigger eac_handle_new_user (security definer)
grant select, update on public.eac_profiles to authenticated;

commit;
