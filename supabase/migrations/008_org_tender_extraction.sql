-- Move LLM extraction from the shared global catalog (006) to a per-org
-- table, since each org now picks its own LLM model.

alter table boamp_notices
  drop column if exists scope_summary,
  drop column if exists contact,
  drop column if exists submission_method;

create table if not exists org_tender_extraction (
  id uuid default gen_random_uuid() primary key,
  org_id uuid not null references orgs (id) on delete cascade,
  tender_id uuid not null references boamp_notices (id) on delete cascade,
  scope_summary text,
  contact text,
  submission_method text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, tender_id)
);

create index if not exists org_tender_extraction_org_idx on org_tender_extraction (org_id);

alter table org_tender_extraction enable row level security;

create policy "Org members can read own extractions" on org_tender_extraction for select to authenticated
  using (org_id in (select org_id from profiles where profiles.id = auth.uid()));
