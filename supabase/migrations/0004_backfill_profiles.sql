-- O trigger eac_on_auth_user_created (migration 0001) só roda para contas
-- CRIADAS DEPOIS dele existir. Quem já tinha conta no projeto antes da
-- migration 0001 rodar (o caso mais provável do "new row violates
-- row-level security policy for table eac_import_jobs": a conta usada pra
-- logar existe há mais tempo e nunca ganhou uma linha em eac_profiles) fica
-- sem papel nenhum, e a RLS trata isso como "não é editor/admin".
--
-- Este backfill cria a linha que falta pra cada conta existente em
-- auth.users, com papel EDITOR por padrão — idempotente (ON CONFLICT DO
-- NOTHING), seguro rodar mais de uma vez e não mexe em quem já tem linha.

begin;

insert into public.eac_profiles (id, full_name)
select id, raw_user_meta_data ->> 'full_name'
from auth.users
on conflict (id) do nothing;

commit;
