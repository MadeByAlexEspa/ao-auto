-- US-5.2: LLM-extracted fields from unstructured notice text.
-- Nullable: extraction failures must not block tender visibility.

alter table boamp_notices
  add column if not exists scope_summary text,
  add column if not exists contact text,
  add column if not exists submission_method text;
