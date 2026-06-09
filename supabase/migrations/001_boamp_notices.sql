create table if not exists boamp_notices (
  id uuid default gen_random_uuid() primary key,
  idweb text unique not null,
  titre text,
  description text,
  url_avis text,
  date_parution date,
  code_departement text,
  nom_acheteur text,
  raw_data jsonb,
  created_at timestamptz default now()
);

create index if not exists boamp_notices_date_idx on boamp_notices (date_parution desc);
create index if not exists boamp_notices_dept_idx on boamp_notices (code_departement);
