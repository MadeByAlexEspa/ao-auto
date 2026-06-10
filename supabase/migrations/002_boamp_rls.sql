alter table boamp_notices enable row level security;

-- Lecture publique (utilisée par la page /boamp avec la clé anon)
create policy "Allow public read access"
  on boamp_notices
  for select
  to anon, authenticated
  using (true);

-- Pas de policy insert/update pour anon : seul le service_role
-- (utilisé par le sync côté serveur) peut écrire, il bypass RLS.
