-- US-1.2: per-org tender status/relevance join table over the global
-- boamp_notices catalog, with RLS isolating each org's rows.

create type tender_status as enum ('new', 'reviewed', 'drafted', 'submitted');

create table if not exists tender_org_status (
  id uuid default gen_random_uuid() primary key,
  tender_id uuid not null references boamp_notices (id) on delete cascade,
  org_id uuid not null references orgs (id) on delete cascade,
  status tender_status not null default 'new',
  relevance boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tender_id, org_id)
);

create index if not exists tender_org_status_org_idx on tender_org_status (org_id);
create index if not exists tender_org_status_tender_idx on tender_org_status (tender_id);

alter table tender_org_status enable row level security;

-- Members of an org can read/write only their org's status rows.
-- Service role (sync/recompute jobs) bypasses RLS as usual.
create policy "Org members can read own tender status"
  on tender_org_status
  for select
  to authenticated
  using (org_id in (select org_id from profiles where profiles.id = auth.uid()));

create policy "Org members can insert own tender status"
  on tender_org_status
  for insert
  to authenticated
  with check (org_id in (select org_id from profiles where profiles.id = auth.uid()));

create policy "Org members can update own tender status"
  on tender_org_status
  for update
  to authenticated
  using (org_id in (select org_id from profiles where profiles.id = auth.uid()))
  with check (org_id in (select org_id from profiles where profiles.id = auth.uid()));
