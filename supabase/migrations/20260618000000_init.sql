-- ============================================================
--  JGA-APP – Supabase Schema
--  Im Supabase Dashboard -> SQL Editor einfügen und "Run".
--  Danach: Database -> Replication -> alle Tabellen für Realtime aktivieren
--  (oder das ALTER PUBLICATION am Ende ausführen).
-- ============================================================

-- ---------- Tabellen ----------

create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                 -- 4-stelliger Beitritts-Code, z.B. "BIER42"
  name          text not null default 'JGA',
  status        text not null default 'lobby',         -- lobby | playing | finished
  current_game  text,                                  -- null (Pause) | duell | quiz
  round_index   int  not null default 0,               -- aktuelle Quiz-Frage
  phase         text not null default 'idle',          -- idle | active | reveal | done
  question_started_at timestamptz,                      -- für Quiz-Timer (serverseitige Referenz)
  config        jsonb not null default '{}'::jsonb,     -- editierbare Aufgaben/Fragen (Admin)
  state         jsonb not null default '{}'::jsonb,     -- Live-Spielzustand: {duel:{...}, history:[...]}
  created_at    timestamptz not null default now()
);

create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  name        text not null,
  is_groom    boolean not null default false,
  is_ready    boolean not null default false,
  score       int not null default 0,
  active      boolean not null default true,           -- false = disqualifiziert
  avatar      jsonb not null default '{}'::jsonb,       -- Avatar-Konfiguration (skin/hair/beard/…)
  created_at  timestamptz not null default now()
);

-- Antworten / Ergebnisse für alle Spielmodi
create table if not exists answers (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  game        text not null,                           -- duell | quiz | bet | vote | taskbet | taskvote
  round_index int  not null,
  value       text,                                    -- Antwort / Ergebnis / JSON-Wette
  is_correct  boolean,
  response_ms int,                                     -- Antwortzeit für Quiz-Speed-Bonus
  points      int not null default 0,
  created_at  timestamptz not null default now(),
  unique (session_id, player_id, game, round_index)
);

-- ---------- Indizes ----------
create index if not exists idx_players_session on players(session_id);
create index if not exists idx_answers_session on answers(session_id);
create index if not exists idx_answers_round on answers(session_id, game, round_index);

-- ---------- Row Level Security ----------
-- Party-App ohne Login: anon darf in der eigenen Session lesen/schreiben.
-- Bewusst offen gehalten (kurzlebige Wegwerf-Session). Siehe README "Sicherheit".

alter table sessions           enable row level security;
alter table players            enable row level security;
alter table answers            enable row level security;

drop policy if exists "public sessions"  on sessions;
drop policy if exists "public players"   on players;
drop policy if exists "public answers"   on answers;

create policy "public sessions"  on sessions           for all using (true) with check (true);
create policy "public players"   on players            for all using (true) with check (true);
create policy "public answers"   on answers            for all using (true) with check (true);

-- ---------- Realtime aktivieren ----------
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table answers;

-- ---------- Hilfsfunktion: Punkte atomar erhöhen ----------
create or replace function add_points(p_player uuid, p_delta int)
returns void language sql as $$
  update players set score = score + p_delta where id = p_player;
$$;

-- ---------- Duell atomar auflösen ----------
-- Claim-Guard + Punktevergabe + Wett-Auszahlung in EINER Transaktion.
-- Rückgabe true = dieser Aufruf hat gewonnen; false = schon aufgelöst / stale.
create or replace function resolve_duel(p_session uuid, p_duel_id text, p_winner uuid, p_detail text)
returns boolean language plpgsql as $$
declare
  v_state jsonb;
  v_duel  jsonb;
  v_groom uuid;
  v_pts   int;
  v_bet   record;
  v_parsed jsonb;
begin
  select state into v_state from sessions where id = p_session for update;
  v_duel := v_state->'duel';
  if v_duel is null
     or v_duel->>'id' is distinct from p_duel_id
     or v_duel->>'winner' is not null then
    return false;
  end if;

  select id into v_groom from players where session_id = p_session and is_groom limit 1;

  -- Punkte: Finale 500 · Verdopplungs-Joker (nur Bräutigam-Sieg) 500 · sonst 250
  if coalesce((v_duel->>'finale')::boolean, false) then
    v_pts := 500;
  elsif v_duel->>'joker' = 'double' and p_winner = v_groom then
    v_pts := 500;
  else
    v_pts := 250;
  end if;

  update players set score = score + v_pts where id = p_winner;
  if v_groom is not null and p_winner is distinct from v_groom then
    update players set score = score + 50 where id = v_groom;  -- Trost: er spielt jedes Duell
  end if;

  -- Wetten: richtig = +Einsatz, falsch = −Einsatz
  for v_bet in
    select player_id, value from answers
    where session_id = p_session and game = 'bet' and round_index = (v_duel->>'n')::int
  loop
    begin
      v_parsed := v_bet.value::jsonb;
      if v_parsed ? 'stake' then
        update players
        set score = score + case when v_parsed->>'on' = p_winner::text
                                 then (v_parsed->>'stake')::int
                                 else -(v_parsed->>'stake')::int end
        where id = v_bet.player_id;
      end if;
    exception when others then null;  -- kaputte Wette blockiert nie das Duell
    end;
  end loop;

  -- Nur den duel-Teilbaum patchen (Joker/History anderer Writes bleiben erhalten)
  update sessions
  set state = jsonb_set(jsonb_set(jsonb_set(state,
        '{duel,winner}', to_jsonb(p_winner::text)),
        '{duel,phase}',  '"done"'),
        '{duel,detail}', to_jsonb(coalesce(p_detail, '')))
  where id = p_session;

  return true;
end $$;

-- ---------- Bräutigam-Aufgabe atomar auflösen ----------
create or replace function resolve_task(p_session uuid, p_task_id text, p_result text)
returns boolean language plpgsql as $$
declare
  v_state jsonb;
  v_task  jsonb;
  v_groom uuid;
  v_bet   record;
  v_parsed jsonb;
  v_correct text;
begin
  select state into v_state from sessions where id = p_session for update;
  v_task := v_state->'task';
  if v_task is null
     or v_task->>'id' is distinct from p_task_id
     or v_task->>'result' is not null then
    return false;
  end if;

  select id into v_groom from players where session_id = p_session and is_groom limit 1;
  if p_result = 'success' and v_groom is not null then
    update players set score = score + 100 where id = v_groom;
  end if;

  v_correct := case when p_result = 'success' then 'ja' else 'nein' end;
  for v_bet in
    select player_id, value from answers
    where session_id = p_session and game = 'taskbet' and round_index = (v_task->>'n')::int
  loop
    begin
      v_parsed := v_bet.value::jsonb;
      if v_parsed ? 'stake' then
        update players
        set score = score + case when v_parsed->>'on' = v_correct
                                 then (v_parsed->>'stake')::int
                                 else -(v_parsed->>'stake')::int end
        where id = v_bet.player_id;
      end if;
    exception when others then null;
    end;
  end loop;

  update sessions
  set state = jsonb_set(jsonb_set(state,
        '{task,result}', to_jsonb(p_result)),
        '{task,phase}',  '"done"')
  where id = p_session;

  return true;
end $$;

-- ---------- Migration (falls Schema v1 schon eingespielt war) ----------
alter table sessions add column if not exists state jsonb not null default '{}'::jsonb;
alter table players  add column if not exists avatar jsonb not null default '{}'::jsonb;
