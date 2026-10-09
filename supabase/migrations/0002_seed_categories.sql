-- Categorias sugeridas pela especificação. Idempotente: usa ON CONFLICT
-- DO NOTHING, então rodar de novo não duplica nem sobrescreve nada.

begin;

insert into public.eac_song_categories (collection, name, slug, sort_order) values
  ('EAC', 'Louvor', 'louvor', 1),
  ('EAC', 'Adoração', 'adoracao', 2),
  ('EAC', 'Comunhão', 'comunhao', 3),
  ('EAC', 'Envio', 'envio', 4)
on conflict (collection, slug) do nothing;

insert into public.eac_song_categories (collection, name, slug, sort_order) values
  ('MISSA', 'Entrada', 'entrada', 1),
  ('MISSA', 'Ato Penitencial', 'ato-penitencial', 2),
  ('MISSA', 'Glória', 'gloria', 3),
  ('MISSA', 'Salmo', 'salmo', 4),
  ('MISSA', 'Aclamação', 'aclamacao', 5),
  ('MISSA', 'Ofertório', 'ofertorio', 6),
  ('MISSA', 'Santo', 'santo', 7),
  ('MISSA', 'Cordeiro', 'cordeiro', 8),
  ('MISSA', 'Comunhão', 'comunhao', 9),
  ('MISSA', 'Pós-Comunhão', 'pos-comunhao', 10),
  ('MISSA', 'Final', 'final', 11),
  ('MISSA', 'Adoração', 'adoracao', 12),
  ('MISSA', 'Maria', 'maria', 13),
  ('MISSA', 'Espírito Santo', 'espirito-santo', 14)
on conflict (collection, slug) do nothing;

commit;
