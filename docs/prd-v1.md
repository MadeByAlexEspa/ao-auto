# PRD: ao-auto V1

See also: [docs/product-vision.md](./product-vision.md)

## Decisions (locked for V1)
1. **Tender catalog**: Global catalog (1 copy of each BOAMP tender), with a per-org join table for status, relevance match, and tracking. No data duplication across tenants.
2. **Extraction fields**: Read-only global baseline in V1. Per-tenant editing of extracted fields deferred to V1.1.
3. **Draft Generation + Internal Knowledge Base**: Deferred to V1.1. V1 ships the collection → filter → extract → review pipeline only.

## V1 Scope (5 feature areas)
1. Multi-tenant data model + RLS
2. BOAMP Collection (finish/automate existing scraper)
3. Relevance Filtering (CPV codes, keywords, geography)
4. Tender Dashboard (list/detail + per-org status workflow)
5. Information Extraction (notice-level structured fields)

## RICE Prioritization

| Feature Area | Reach | Impact | Confidence | Effort (wks) | RICE | Tier |
|---|---|---|---|---|---|---|
| BOAMP Collection (finish) | 10 | 3 | 1.0 | 1 | 30.0 | Must-have |
| Multi-tenant data model + RLS | 10 | 3 | 1.0 | 2 | 15.0 | Must-have, foundational |
| Relevance Filtering | 10 | 2 | 0.8 | 1.5 | 10.7 | Must-have |
| Tender Dashboard | 10 | 2 | 1.0 | 2 | 10.0 | Must-have |
| Information Extraction | 10 | 3 | 0.8 | 2.5 | 9.6 | Must-have |
| Draft Generation (V1.1) | 8 | 2 | 0.5 | 3 | 2.7 | Deferred |
| Knowledge Base (V1.1) | 8 | 1.5 | 0.8 | 2 | 4.8 | Deferred |
| Admin Controls (manual/config for now) | 6 | 1 | 0.8 | 1.5 | 3.2 | Deferred/minimal |

## Functional Requirements

### 1. Multi-tenant data model + RLS
- FR1: Every domain table (tenders, tender_org_status, kb_documents later, profiles) has `org_id` where tenant-scoped; the global tender catalog itself does **not** have `org_id` (shared across tenants).
- FR2: Supabase RLS policies enforce `org_id = auth user's org` on all tenant-scoped tables (status, filters, future KB/drafts).
- FR3: `profiles` table maps `auth.users.id` → `org_id` (single org per user for V1).
- FR4: A per-org join table (e.g. `tender_org_status`) stores: tender_id, org_id, status, relevance flag — created lazily when a tender first becomes relevant to an org (re-evaluated on filter save).
- FR5: Service-role key (already used for BOAMP sync writes) scoped to system-level writes to the global tender catalog only; all user-facing reads/writes go through RLS-enforced client.
- FR6: Seed one test org + test user for dev/QA.

### 2. BOAMP Collection (finish existing work)
- FR1: Sync job runs on schedule (Vercel cron), extending `src/lib/boamp` + `src/app/api/boamp/sync`.
- FR2: Manual sync button remains as fallback/debug.
- FR3: Idempotent upsert on BOAMP notice ID — no duplicates on re-run.
- FR4: Partial failures don't fail the whole batch; errors logged.
- FR5: Raw notice payload stored alongside normalized fields (for future re-extraction).

### 3. Relevance Filtering
- FR1: Per-org filter config: CPV codes (prefix-match), keywords (match title/description), geography (department/region).
- FR2: Tender is "relevant" for an org if it matches any CPV OR keyword AND geography (if set) — OR-within-category, AND-across-categories (default, confirm with pilot user).
- FR3: Dashboard defaults to relevant-only view; toggle to "show all".
- FR4: Filter config editable via simple settings form.
- FR5: Filter changes re-evaluate relevance retroactively across the global catalog (recompute `tender_org_status` rows).

### 4. Tender Dashboard
- FR1: List view: title, buyer, deadline, CPV code(s), status, relevance indicator — sortable, default sort by soonest deadline.
- FR2: Detail view: full extracted fields (read-only) + link to original BOAMP notice.
- FR3: Per-org status: `new` (default on relevance match) → `reviewed` → `drafted` → `submitted`. Same global tender can have different status per org. Non-sequential transitions allowed.
- FR4: Status transitions via dropdown/button on detail view.
- FR5: Status-count badges on dashboard (e.g. "12 new, 3 reviewed").
- FR6: Visual flag for tenders with deadline < 7 days and status still `new`.

### 5. Information Extraction (notice-level, global baseline)
- FR1: Runs automatically as part of/immediately after BOAMP sync for new tenders.
- FR2: Fields stored on the global tender record: title, deadline (date+time), buyer, scope summary, CPV code(s), contact info, submission method.
- FR3: Use BOAMP's own structured fields directly where available (title, buyer, CPV, deadline); reserve LLM extraction for scope summary and unstructured fields (submission method, contact parsing).
- FR4: Extraction failures don't block tender visibility — missing fields show as blank/"not available".
- FR5: Read-only in V1 — no per-org edits (deferred to V1.1).

## Acceptance Criteria Conventions
- Given/When/Then format.
- Every tenant-scoped story includes an RLS test: e.g. "Given a user from Org A, when they query tenders/status, then they see only Org A's data (verified against seeded Org B data)."
- Sync/extraction stories include a failure-mode criterion (partial failure doesn't crash the job).
- Filter/relevance stories include at least one positive and one negative matching example.
- UI stories specify acceptance in terms of visible states/data, not visual design.
- Each feature area maps to ~3-6 stories; split persistence/RLS work from UI work where possible.

## Deferred to V1.1
- Draft Generation (manual trigger, single-doc, using internal KB)
- Internal Knowledge Base (per-tenant file upload + storage)
- Per-tenant editable extraction fields
- Admin UI for source/filter management beyond simple settings form
