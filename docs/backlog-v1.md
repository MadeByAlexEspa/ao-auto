# ao-auto V1 Backlog — User Stories

See also: [docs/product-vision.md](./product-vision.md), [docs/prd-v1.md](./prd-v1.md), [docs/ux-v1.md](./ux-v1.md)

---

## Feature Area 1: Multi-Tenant Data Model + RLS

### US-1.1 — Core schema: orgs, profiles, global tender catalog
**As a** developer, **I want** the foundational tables (`orgs`, `profiles`, global `tenders`) created with correct scoping, **so that** all later features have a tenant-aware data model to build on.

**Story points:** 5
**Dependencies:** None (foundational — blocks all other stories)

**Acceptance Criteria:**
- Given a fresh database, when migrations run, then `orgs`, `profiles` (with `org_id` FK to `orgs`), and global `tenders` (no `org_id` column) tables exist.
- Given the `profiles` table, when a user signs up, then exactly one `org_id` is assigned per user (single-org model).
- Given the global `tenders` table, when inspected, then it has no `org_id` column and is shared across all tenants.

---

### US-1.2 — Per-org tender status join table + RLS policies
**As a** developer, **I want** `tender_org_status` created with RLS enforcing `org_id` isolation, **so that** each org's tender status/relevance data is private.

**Story points:** 5
**Dependencies:** US-1.1

**Acceptance Criteria:**
- Given the `tender_org_status` table (`tender_id`, `org_id`, `status`, `relevance` flag), when RLS policies are applied, then SELECT/INSERT/UPDATE are restricted to rows where `org_id` matches the requesting user's `profiles.org_id`.
- Given a user from Org A, when they query `tender_org_status`, then they see only Org A's rows (verified against seeded Org B data).
- Given a user from Org A, when they attempt to INSERT or UPDATE a row with `org_id` = Org B, then the operation is rejected by RLS.
- Given the global `tenders` table, when a user from Org A queries it, then they can read all global tenders (no RLS restriction on the catalog itself), but join data is still scoped via `tender_org_status`.

---

### US-1.3 — Service-role write scoping for BOAMP sync
**As a** developer, **I want** the service-role key restricted to system-level writes on the global `tenders` catalog only, **so that** sync jobs can't bypass RLS for tenant-scoped tables.

**Story points:** 2
**Dependencies:** US-1.1, US-1.2

**Acceptance Criteria:**
- Given the BOAMP sync job using the service-role key, when it writes to the global `tenders` table, then the write succeeds regardless of RLS (service-role bypasses RLS by design on this table only).
- Given the BOAMP sync job, when it attempts to write directly to `tender_org_status` or `profiles`, then this path does not exist in the sync code (verified by code review / no such calls in `src/lib/boamp` or `src/app/api/boamp/sync`).
- Given a client-side (anon/authenticated) request, when it attempts to write to the global `tenders` table, then it is rejected (only service-role can write there).

---

### US-1.4 — Seed test org, test user, and second org for RLS verification
**As a** developer, **I want** seed data for one primary test org/user and one secondary "Org B" with sample `tender_org_status` rows, **so that** RLS isolation can be verified in dev/QA across all future stories.

**Story points:** 2
**Dependencies:** US-1.1, US-1.2

**Acceptance Criteria:**
- Given the seed script runs, when complete, then two orgs exist ("Org A" with a test user, "Org B" with a separate test user), each with at least 2 `tender_org_status` rows referencing existing global tenders.
- Given the Org A test user is authenticated, when querying `tender_org_status`, then only Org A's seeded rows are returned (Org B's rows are absent).
- Given the seed script runs multiple times, when re-run, then it does not duplicate org/user/status rows (idempotent).

---

## Feature Area 2: BOAMP Collection

### US-2.1 — Idempotent upsert on BOAMP notice ID
**As a** developer, **I want** the sync job to upsert tenders by BOAMP notice ID with raw payload + normalized fields stored, **so that** repeated syncs don't create duplicates and raw data is preserved for re-extraction.

**Story points:** 3
**Dependencies:** US-1.1

**Acceptance Criteria:**
- Given a BOAMP notice already exists in the global `tenders` table, when the sync job processes the same notice ID again, then the existing row is updated in place (no duplicate row created).
- Given a new BOAMP notice, when the sync job processes it, then a new row is created with both the raw notice payload (e.g. JSONB column) and normalized fields (title, buyer, deadline, CPV).
- Given a sync run with a mix of new and existing notices, when complete, then the total row count increases only by the number of genuinely new notices.

---

### US-2.2 — Partial failure handling and error logging
**As a** developer, **I want** the sync job to continue processing remaining notices when an individual notice fails, **so that** one bad record doesn't fail the entire batch.

**Story points:** 3
**Dependencies:** US-2.1

**Acceptance Criteria:**
- Given a batch of 10 notices where 1 has malformed data (e.g. invalid date), when the sync job runs, then the other 9 notices are upserted successfully.
- Given the malformed notice, when processing fails, then an error is logged (with notice ID and error reason) without raising an unhandled exception that aborts the job.
- Given the sync job completes with partial failures, when the response/log is inspected, then it reports counts of succeeded vs. failed notices.

---

### US-2.3 — Vercel cron automation for sync job
**As a** product owner, **I want** the BOAMP sync to run automatically on a schedule, **so that** new tenders are collected without manual intervention.

**Story points:** 3
**Dependencies:** US-2.1, US-2.2

**Acceptance Criteria:**
- Given the Vercel cron configuration, when the scheduled time arrives (e.g. daily), then `src/app/api/boamp/sync` is invoked automatically.
- Given the cron-triggered sync runs successfully, when complete, then new/updated tenders appear in the global `tenders` table without any UI interaction.
- Given the cron job fails (e.g. BOAMP source unreachable), when this occurs, then the failure is logged and does not crash subsequent scheduled runs.

---

### US-2.4 — Manual sync button retained as fallback
**As a** bid writer, **I want** the existing manual sync button to remain functional alongside the automated cron, **so that** I can trigger a sync on demand for debugging or urgent updates.

**Story points:** 1
**Dependencies:** US-2.1, US-2.2 (reuses same sync code path)

**Acceptance Criteria:**
- Given the home page manual sync button, when clicked, then it triggers the same sync logic as the cron job (`src/app/api/boamp/sync`).
- Given a manual sync is triggered while a cron sync is also configured, when both could run, then the upsert logic (US-2.1) prevents duplication regardless of trigger source.
- Given the manual sync completes, when the page is viewed, then a success/failure indication is shown to the user.

---

## Feature Area 3: Relevance Filtering

### US-3.1 — Per-org filter configuration persistence
**As a** developer, **I want** a per-org filter table (CPV codes, keywords, geography) with RLS, **so that** each org's relevance criteria are stored and isolated.

**Story points:** 3
**Dependencies:** US-1.2

**Acceptance Criteria:**
- Given a filter config table (`org_filters` or similar, with `org_id`, CPV code list, keyword list, geography list), when RLS is applied, then a user from Org A can only read/write Org A's filter config.
- Given a user from Org A, when they query filter config, then Org B's seeded filter config is not returned (verified against seeded Org B data).
- Given an org with no filter config saved, when queried, then an empty/default config is returned (no error).

---

### US-3.2 — Relevance matching logic (CPV/keyword OR, geography AND)
**As a** developer, **I want** a function that evaluates whether a global tender matches an org's filter config, **so that** relevance can be computed consistently for recompute and dashboard display.

**Story points:** 5
**Dependencies:** US-3.1

**Acceptance Criteria:**
- Given an org with CPV prefix "9091" and no geography set, when a tender with CPV code "90910000" and title "Nettoyage des locaux" is evaluated, then it is marked **relevant** (positive match: CPV prefix match).
- Given an org with CPV prefix "4500" and keyword "informatique" and geography "Rhône (69)", when a tender has CPV "33100000", title contains "fourniture matériel médical", and department "Paris (75)", then it is marked **not relevant** (negative match: no CPV/keyword match, and geography excludes it even if one had matched).
- Given an org with keyword "entretien espaces verts" and geography "Auvergne-Rhône-Alpes", when a tender's description contains "entretien espaces verts" and its department is "Rhône (69)" (within the region), then it is marked **relevant** (keyword match AND geography match).
- Given an org with no CPV codes, no keywords, and no geography configured, when any tender is evaluated, then it is marked **not relevant** (empty filter config matches nothing).

---

### US-3.3 — Lazy creation of `tender_org_status` on relevance match
**As a** developer, **I want** `tender_org_status` rows created automatically when a tender becomes relevant to an org, **so that** the join table only contains rows orgs actually care about.

**Story points:** 3
**Dependencies:** US-3.2, US-1.2

**Acceptance Criteria:**
- Given a new tender enters the global catalog (via sync) and matches Org A's filter config, when relevance is evaluated, then a `tender_org_status` row is created for Org A with `status = 'new'` and `relevance = true`.
- Given the same tender does not match Org B's filter config, when relevance is evaluated, then no `tender_org_status` row is created for Org B.
- Given a tender does not match any org's filters, when sync completes, then no `tender_org_status` rows are created for it (it remains visible only via "Show all").

---

### US-3.4 — Filter save triggers async recompute
**As a** bid writer, **I want** saving my filter settings to retroactively re-evaluate relevance across the catalog, **so that** my dashboard reflects updated criteria without manual re-sync.

**Story points:** 5
**Dependencies:** US-3.2, US-3.3

**Acceptance Criteria:**
- Given a user saves updated filter config (e.g. adds a new CPV code), when the save completes, then the API responds immediately (does not block on full recompute) and the UI shows a toast: "Filters saved — your relevant tender list is updating".
- Given the recompute job runs after save, when complete, then `tender_org_status` rows are created for newly-matching tenders and existing rows' `relevance` flag is updated to `false` for tenders that no longer match.
- Given a tender previously marked relevant now has `relevance = false` after recompute, when the dashboard is viewed in "relevant only" mode, then it no longer appears, but its `status` value (e.g. `reviewed`) is preserved (not deleted).
- Given the recompute job fails partway through (e.g. error on one tender), when this occurs, then it logs the error and continues processing remaining tenders (failure-mode criterion).

---

### US-3.5 — Filter Settings UI (CPV/keyword/geography chip inputs)
**As a** bid writer, **I want** a settings screen to add/remove CPV codes, keywords, and geography filters, **so that** I can configure which tenders are relevant to my org.

**Story points:** 3
**Dependencies:** US-3.1, US-3.4

**Acceptance Criteria:**
- Given the Filter Settings screen, when loaded, then it displays the org's current CPV codes, keywords, and geography values as chips, each removable.
- Given the user adds a new CPV code via "+ Add" and clicks "Save", then the new value persists to `org_filters` and the success toast (US-3.4) is shown.
- Given an org has no CPV codes or keywords configured, when the Filter Settings screen loads, then the placeholder text "No CPV codes added — add at least one filter category to see relevant tenders" is shown.
- Given the matching-logic note ("matches any CPV OR any keyword, AND geography if set"), when the screen is loaded, then it is always visible regardless of filter state.
- Given the user clicks "Cancel" after making unsaved changes, when this occurs, then the changes are discarded and the previously saved config is displayed.

---

## Feature Area 4: Tender Dashboard

### US-4.1 — Dashboard query: relevant-only vs. show-all with RLS
**As a** developer, **I want** a data-access layer that returns the correct tender list (joined with `tender_org_status`) for "relevant only" and "show all" modes, **so that** the dashboard UI has a correct, tenant-scoped data source.

**Story points:** 3
**Dependencies:** US-3.3, US-1.2

**Acceptance Criteria:**
- Given a user from Org A in "relevant only" mode, when the query runs, then only global tenders with a matching `tender_org_status` row (`org_id = Org A`, `relevance = true`) are returned.
- Given a user from Org A in "show all" mode, when the query runs, then all global tenders are returned, with `status`/`relevance` shown as `—` for tenders lacking a `tender_org_status` row for Org A.
- Given a user from Org A, when either query mode runs, then no `tender_org_status` rows belonging to Org B are returned or used to compute Org A's results (verified against seeded Org B data).
- Given the query result, when returned, then each tender includes: title, buyer, deadline, CPV code(s), status (or `—`), and a computed urgency flag.

---

### US-4.2 — Dashboard list view: status counts, sorting, urgency flags
**As a** bid writer, **I want** the dashboard to show status-count badges, a sortable list (default by soonest deadline), and urgency-colored flags, **so that** I can quickly triage which tenders need attention.

**Story points:** 5
**Dependencies:** US-4.1

**Acceptance Criteria:**
- Given Org A has 12 tenders with `status = 'new'`, 3 `reviewed`, 1 `drafted`, 0 `submitted`, when the dashboard loads, then the status-count bar shows "12 New · 3 Reviewed · 1 Drafted · 0 Submitted".
- Given the list is loaded, when no sort is explicitly chosen, then rows are ordered by soonest deadline first.
- Given a tender has `status = 'new'` and deadline < 7 days from today, when displayed, then it shows a 🔴 red urgency flag.
- Given a tender has `status = 'reviewed'` or `'drafted'` and deadline < 7 days, when displayed, then it shows a 🟠 amber urgency flag.
- Given a tender has `status = 'submitted'`, when displayed, then no urgency flag is shown regardless of deadline proximity.
- Given the user selects a different sort column (e.g. Title), when applied, then the list re-orders accordingly.

---

### US-4.3 — Dashboard CPV display and empty states
**As a** bid writer, **I want** CPV codes shown with human-readable labels and "+N more", and clear empty-state messages, **so that** I understand what each tender covers and what to do when there's nothing to show.

**Story points:** 2
**Dependencies:** US-4.2

**Acceptance Criteria:**
- Given a tender has CPV code "90910000" and a static lookup table maps it to "Nettoyage", when displayed on the dashboard, then it shows "90910 — Nettoyage".
- Given a tender has 3 CPV codes, when displayed on the dashboard row, then the primary CPV code + label is shown followed by "+2 more".
- Given Org A's "relevant only" view returns zero tenders, when the dashboard loads, then it displays "No relevant tenders right now. [Adjust your filters →]" linking to Filter Settings.
- Given the global `tenders` table is empty (no sync has run yet), when the dashboard loads (in either mode), then it displays "No tenders collected yet. Sync runs automatically, or [trigger manual sync]."

---

### US-4.4 — Tender detail view: extracted fields + original notice link
**As a** bid writer, **I want** a detail view showing all extracted fields and a link to the original BOAMP notice, **so that** I can assess the tender without leaving the app, with an escape hatch if extraction is insufficient.

**Story points:** 3
**Dependencies:** US-4.1, depends on extraction fields existing (US-5.2)

**Acceptance Criteria:**
- Given a tender with all extracted fields populated, when the detail view loads, then it displays title, deadline (date + time), buyer, CPV code(s) (full list), submission method, contact, and scope summary.
- Given a tender with a missing field (e.g. contact info not extracted), when the detail view loads, then that field displays "Not available" in place of blank/hidden (stable layout).
- Given the detail view, when loaded, then a "View original BOAMP notice" link is present and points to the correct external BOAMP URL for that notice.
- Given a user from Org A views a tender's detail page that has no `tender_org_status` row for Org A (accessed via "show all"), when loaded, then the page renders correctly showing `—` for status/relevance without error.

---

### US-4.5 — Status transitions on detail view (non-sequential, per-org)
**As a** bid writer, **I want** to change a tender's status via a dropdown on the detail view, **so that** I can track my org's progress through new → reviewed → drafted → submitted, independent of other orgs.

**Story points:** 3
**Dependencies:** US-4.4, US-1.2

**Acceptance Criteria:**
- Given a tender's detail view with status "NEW", when the user selects "submitted" from the dropdown (skipping intermediate states), then the status updates to "submitted" without a confirmation modal (non-sequential transition allowed).
- Given Org A updates a tender's status to "reviewed", when Org B (seeded with the same global tender) views their detail page for that tender, then Org B's status remains unchanged (verified against seeded Org B data — RLS test).
- Given the status is updated to "submitted", when the user returns to the dashboard, then the urgency flag for that tender is gone (per US-4.2 rule) and the status-count badges reflect the change.
- Given a status update request for a tender belonging to Org A, when a user from Org B attempts to issue that update (e.g. via API manipulation), then RLS rejects the write (verified against seeded Org B data).

---

## Feature Area 5: Information Extraction

### US-5.1 — Direct field mapping from BOAMP structured data
**As a** developer, **I want** title, buyer, CPV codes, and deadline populated directly from BOAMP's structured fields during sync, **so that** these reliable fields are available without LLM cost/latency.

**Story points:** 2
**Dependencies:** US-2.1

**Acceptance Criteria:**
- Given a BOAMP notice with structured `title`, `buyer`, `cpv`, and `deadline` fields, when synced, then these values are copied directly into the global `tenders` table's normalized columns.
- Given a BOAMP notice missing one of these structured fields (e.g. no CPV provided), when synced, then the corresponding column is stored as `NULL` (to be rendered as "Not available" per US-4.4), and the sync does not fail.
- Given the deadline field, when stored, then it includes both date and time components.

---

### US-5.2 — LLM extraction for scope summary, contact, and submission method
**As a** developer, **I want** an LLM-based extraction step for unstructured fields (scope summary, contact info, submission method), **so that** the detail view can show meaningful summaries beyond raw BOAMP structured data.

**Story points:** 5
**Dependencies:** US-2.1, US-5.1

**Acceptance Criteria:**
- Given a BOAMP notice's raw payload (stored per US-2.1), when extraction runs as part of/immediately after sync, then `scope_summary`, `contact`, and `submission_method` columns are populated on the global `tenders` table.
- Given the raw payload contains unstructured free text describing the contract scope, when the LLM extraction runs, then `scope_summary` contains a human-readable summary derived from that text.
- Given the LLM extraction fails for a notice (e.g. API timeout or error), when this occurs, then the affected fields remain `NULL`/"not available", the error is logged, and the notice remains visible on the dashboard with other fields populated (failure-mode criterion — extraction failure does not block tender visibility).
- Given a batch sync where extraction fails for 1 of 10 notices, when the batch completes, then extraction succeeds for the other 9 (partial failure isolation, consistent with US-2.2).

---

### US-5.3 — Extraction runs automatically post-sync for new tenders only
**As a** developer, **I want** extraction to trigger automatically only for newly-inserted tenders (not re-run on every upsert of existing tenders), **so that** extraction cost/latency is controlled and existing data isn't unnecessarily overwritten.

**Story points:** 3
**Dependencies:** US-2.1, US-5.2

**Acceptance Criteria:**
- Given a sync run where 8 notices are new and 2 are updates to existing rows, when sync completes, then extraction (US-5.2) runs only for the 8 new notices.
- Given an existing tender already has `scope_summary` populated, when the sync upserts that same notice again (e.g. updated deadline from BOAMP), then `scope_summary` is preserved unchanged (read-only baseline, not re-extracted).
- Given the raw payload is stored for every notice regardless of extraction outcome (per US-2.1), when re-extraction is needed in a future phase, then the raw payload is available to support it (no data loss).

---

# Dependency Order

```
US-1.1 (core schema)
  └─> US-1.2 (RLS + tender_org_status)
        ├─> US-1.3 (service-role scoping)
        ├─> US-1.4 (seed data)
        ├─> US-3.1 (filter config table)
        ├─> US-3.3 (lazy status rows) ─── needs US-3.2
        ├─> US-4.1 (dashboard query)
        └─> US-4.5 (status transitions)

US-2.1 (idempotent upsert)
  ├─> US-2.2 (partial failure) ─> US-2.3 (cron) ─> US-2.4 (manual fallback retained)
  ├─> US-5.1 (direct field mapping)
  │     └─> US-5.2 (LLM extraction) ─> US-5.3 (new-only trigger)
  └─> (feeds global catalog used by US-3.2, US-3.3)

US-3.1 ─> US-3.2 (matching logic) ─> US-3.3 ─> US-3.4 (async recompute) ─> US-3.5 (filter UI)

US-4.1 ─> US-4.2 (list view) ─> US-4.3 (CPV/empty states)
US-4.1 + US-5.2 ─> US-4.4 (detail view) ─> US-4.5 (status transitions)
```

**Total story points:** 67 (across 22 stories)

**Suggested sprint grouping** (assuming ~12-15 pts/sprint):
- **Sprint 1 (foundation):** US-1.1, US-1.2, US-1.3, US-1.4, US-2.1 (15 pts)
- **Sprint 2 (pipeline):** US-2.2, US-2.3, US-2.4, US-5.1, US-5.2 (14 pts)
- **Sprint 3 (filtering):** US-3.1, US-3.2, US-3.3, US-5.3 (14 pts)
- **Sprint 4 (recompute + dashboard core):** US-3.4, US-4.1, US-4.2 (13 pts)
- **Sprint 5 (UI completion):** US-3.5, US-4.3, US-4.4, US-4.5 (11 pts)
