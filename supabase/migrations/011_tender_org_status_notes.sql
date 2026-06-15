-- Free-text notes for the org's response workspace on a tender.
alter table tender_org_status
  add column if not exists notes text;
