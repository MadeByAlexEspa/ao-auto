-- US-1.1: orgs + profiles (multi-tenant foundation)

create table if not exists orgs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references orgs (id) on delete restrict,
  created_at timestamptz default now()
);

alter table orgs enable row level security;
alter table profiles enable row level security;

-- Users can read their own org and profile (needed to resolve org_id client-side)
create policy "Users can read own org"
  on orgs
  for select
  to authenticated
  using (id in (select org_id from profiles where profiles.id = auth.uid()));

create policy "Users can read own profile"
  on profiles
  for select
  to authenticated
  using (id = auth.uid());

-- New auth users get a profile assigned from raw_user_meta_data.org_id.
-- Falls back to creating a fresh org if none is provided (e.g. first signup
-- for a new tenant), so every user always resolves to exactly one org.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_org_id uuid;
begin
  target_org_id := (new.raw_user_meta_data ->> 'org_id')::uuid;

  if target_org_id is null then
    insert into orgs (name) values (coalesce(new.raw_user_meta_data ->> 'org_name', new.email))
    returning id into target_org_id;
  end if;

  insert into profiles (id, org_id) values (new.id, target_org_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
