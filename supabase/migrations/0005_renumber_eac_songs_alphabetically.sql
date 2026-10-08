-- Renumera as músicas publicadas do Livro EAC pela ordem alfabética atual.
-- Seguro para reaplicar: os números são recalculados de 1..N conforme o título.

with ordered as (
  select
    id,
    row_number() over (
      order by lower(unaccent(title)), lower(title), id
    )::int as new_number
  from public.eac_songs
  where collection = 'EAC'
    and status = 'PUBLISHED'
)
update public.eac_songs s
set number = o.new_number
from ordered o
where s.id = o.id
  and s.number is distinct from o.new_number;
