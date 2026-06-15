-- Second tender source: PLACE (marches-publics.gouv.fr), scraped from its
-- HTML search portal (no public API). Mirrors boamp_notices' shape so both
-- sources can be merged/filtered the same way.

create table if not exists place_notices (
  id uuid default gen_random_uuid() primary key,
  reference text unique not null,
  titre text not null,
  description text not null,
  organisme text,
  code_departement text,
  date_parution date,
  date_limite_reponse timestamptz,
  url_avis text not null,
  raw_data jsonb not null default '{}',
  created_at timestamptz default now()
);

create index if not exists place_notices_deadline_idx on place_notices (date_limite_reponse);

alter table place_notices enable row level security;

create policy "Allow public read access" on place_notices for select to anon, authenticated
  using (true);
