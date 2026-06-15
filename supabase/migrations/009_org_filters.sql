-- US-3.1: per-org relevance filter configuration.

create table if not exists org_filters (
  org_id uuid primary key references orgs (id) on delete cascade,
  cpv_codes text[] not null default '{}',
  keywords text[] not null default '{}',
  departments text[] not null default '{}',
  updated_at timestamptz default now()
);

alter table org_filters enable row level security;

create policy "Org members can read own filters" on org_filters for select to authenticated
  using (org_id in (select org_id from profiles where profiles.id = auth.uid()));

create policy "Org members can insert own filters" on org_filters for insert to authenticated
  with check (org_id in (select org_id from profiles where profiles.id = auth.uid()));

create policy "Org members can update own filters" on org_filters for update to authenticated
  using (org_id in (select org_id from profiles where profiles.id = auth.uid()))
  with check (org_id in (select org_id from profiles where profiles.id = auth.uid()));
