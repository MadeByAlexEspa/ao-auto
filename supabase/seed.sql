-- US-1.4: seed data for local dev / RLS verification.
-- Creates two orgs ("Org A", "Org B"), one auth user per org, a couple of
-- sample boamp_notices if the catalog is empty, and tender_org_status rows
-- so RLS isolation between orgs can be exercised manually or in tests.

insert into orgs (id, name) values
  ('00000000-0000-0000-0000-00000000000a', 'Org A'),
  ('00000000-0000-0000-0000-00000000000b', 'Org B')
on conflict (id) do nothing;

-- Test auth users. raw_user_meta_data.org_id drives the handle_new_user
-- trigger so each user is assigned to the right org's profile.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-00000000000a',
    'authenticated', 'authenticated', 'orga@example.com',
    crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"org_id":"00000000-0000-0000-0000-00000000000a"}',
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-00000000000b',
    'authenticated', 'authenticated', 'orgb@example.com',
    crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{"org_id":"00000000-0000-0000-0000-00000000000b"}',
    now(), now()
  )
on conflict (id) do nothing;

-- Sample tenders if the catalog is empty (so seeded status rows have
-- something to reference).
insert into boamp_notices (idweb, titre, description, url_avis, date_parution, code_departement, nom_acheteur, raw_data)
select * from (values
  ('SEED-0001', 'Nettoyage des locaux administratifs', 'Prestation de nettoyage', 'https://boamp.fr/seed-0001', current_date, '69', 'Mairie de Lyon', '{}'::jsonb),
  ('SEED-0002', 'Maintenance espaces verts', 'Entretien espaces verts', 'https://boamp.fr/seed-0002', current_date, '75', 'Mairie de Paris', '{}'::jsonb)
) as v(idweb, titre, description, url_avis, date_parution, code_departement, nom_acheteur, raw_data)
where not exists (select 1 from boamp_notices)
on conflict (idweb) do nothing;

-- tender_org_status rows for each org against the first two tenders in the
-- catalog, so an Org A user sees different status from an Org B user on the
-- same global tender (for RLS isolation tests).
insert into tender_org_status (tender_id, org_id, status, relevance)
select t.id, '00000000-0000-0000-0000-00000000000a', 'new', true
from boamp_notices t
order by t.created_at
limit 2
on conflict (tender_id, org_id) do nothing;

insert into tender_org_status (tender_id, org_id, status, relevance)
select t.id, '00000000-0000-0000-0000-00000000000b', 'reviewed', true
from boamp_notices t
order by t.created_at
limit 1
on conflict (tender_id, org_id) do nothing;
