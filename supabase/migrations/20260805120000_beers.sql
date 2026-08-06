-- Bierzähler pro Spieler + atomares Hochzählen (kein Lost-Update,
-- wenn zwei Handys gleichzeitig anstoßen)
alter table players add column if not exists beers int not null default 0;

create or replace function add_beer(p_player uuid, p_delta int)
returns int language sql as $$
  update players
  set beers = greatest(0, beers + p_delta)
  where id = p_player
  returning beers;
$$;
