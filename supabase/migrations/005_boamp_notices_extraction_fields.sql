-- US-5.1: direct field mapping additions — deadline and CPV code(s),
-- populated straight from BOAMP's own structured data during sync.

alter table boamp_notices
  add column if not exists date_limite_reponse timestamptz,
  add column if not exists code_cpv text;

create index if not exists boamp_notices_deadline_idx on boamp_notices (date_limite_reponse);
