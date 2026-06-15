-- Per-org LLM model selection for extraction.

create table if not exists org_settings (
  org_id uuid primary key references orgs (id) on delete cascade,
  llm_model text not null default 'openai/gpt-4o-mini',
  updated_at timestamptz default now()
);

alter table org_settings enable row level security;

create policy "Org members can read own settings" on org_settings for select to authenticated
  using (org_id in (select org_id from profiles where profiles.id = auth.uid()));

create policy "Org members can insert own settings" on org_settings for insert to authenticated
  with check (org_id in (select org_id from profiles where profiles.id = auth.uid()));

create policy "Org members can update own settings" on org_settings for update to authenticated
  using (org_id in (select org_id from profiles where profiles.id = auth.uid()))
  with check (org_id in (select org_id from profiles where profiles.id = auth.uid()));
