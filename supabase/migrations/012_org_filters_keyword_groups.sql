-- Replace flat keyword list with AND-of-OR keyword groups for more precise matching.
-- Each group is an array of synonyms (OR); a tender must match at least one
-- keyword in EVERY group to be considered a keyword match.

alter table org_filters
  add column if not exists keyword_groups jsonb not null default '[]';

alter table org_filters
  drop column if exists keywords;
