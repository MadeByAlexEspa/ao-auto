# Product Vision: ao-auto

## Vision Statement

**Problem:** Small and medium businesses that respond to French public tenders spend enormous manual effort on three repetitive tasks: monitoring multiple procurement platforms (BOAMP, Place des Marchés/Maximilien, etc.) for relevant opportunities, reading lengthy tender documents to extract key facts (deadlines, eligibility, scope, lots, contacts), and drafting initial proposal responses from scratch each time — often reusing the same boilerplate, certifications, and past answers.

**Target User:** Bid writers / business development staff at SMBs who respond to public tenders regularly but lack a dedicated bid-management team or tooling budget for enterprise platforms.

**Value Proposition:** ao-auto turns tender response from a multi-day manual research-and-writing exercise into a streamlined review-and-refine workflow — automatically aggregating relevant tenders, surfacing the key facts that determine go/no-go and response requirements, and generating a first-draft response grounded in the company's own past proposals and capability documents.

**Tenancy model:** Multi-tenant — ao-auto is a product for multiple SMB clients, each with their own knowledge base, tenders, and users. Data model and architecture must enforce tenant isolation from the start.

---

## Scope: V1 vs Later Phases

### V1 (MVP)
- **Collection:** BOAMP only (already started), expand filtering (CPV codes, geography, keywords) so users see only relevant notices
- **Extraction:** Structured extraction of core fields from a single tender notice (title, deadline, buyer, scope summary, CPV codes, contact, submission method) — notice-level metadata, not full document parsing
- **Drafting:** Manual-trigger draft generation using a small, manually-curated internal knowledge base (a handful of uploaded reference docs: company profile, certifications, past proposal excerpts) — output is a single-document draft, human-edited before submission
- **Workflow:** Dashboard listing tenders with status (new / reviewed / drafted / submitted), manual review at each stage

### Phase 2
- Add Place des Marchés / Maximilien and other regional platforms as additional collection sources
- Extraction expands to full tender document sets (DCE — cahier des charges, RC, CCAP), pulling deeper requirements (technical criteria, award criteria/weighting, lots, mandatory annexes)
- Knowledge base becomes structured/searchable (semantic search over past proposals, references, case studies)
- Draft generation becomes section-aware (mirrors the tender's required response structure)

### Phase 3
- Automated relevance scoring / go-no-go recommendation per tender
- Multi-source dedup and normalization across platforms
- Collaborative review workflow (assign tenders, comments, version history on drafts)
- Feedback loop: track win/loss outcomes to improve draft quality and relevance scoring over time

---

## Key Feature Areas

1. **Tender Collection Engine** — Scrapers/connectors per platform (BOAMP, Maximilien, ...) that ingest and normalize tender notices into a shared schema.
2. **Relevance Filtering** — Configurable filters (CPV codes, keywords, geography, value thresholds) so the dashboard surfaces only tenders worth the user's attention.
3. **Tender Dashboard** — Central list/detail view of collected tenders with status tracking through the pipeline.
4. **Information Extraction** — Parses tender notices (and later, full document sets) into structured fields: deadlines, scope, eligibility, lots, contacts, criteria.
5. **Internal Knowledge Base** — Repository of company reference materials (capability statements, certifications, past proposals) used as grounding context for drafting, scoped per tenant.
6. **Draft Generation** — Produces a first-draft response document combining extracted tender requirements with internal knowledge base content.
7. **Manual Sync / Admin Controls** — Trigger collection runs, manage sources, manage knowledge base uploads (extends existing manual sync button).

---

## Major Open Questions / Risks

- **Data source access & legality:** Confirm BOAMP's terms allow automated scraping at this frequency; investigate whether Maximilien/Place des Marchés offer APIs vs. requiring scraping (scraping may be more fragile/legally ambiguous and platform-specific anti-bot measures could break collection).
- **Document format diversity:** Tender document sets (DCE) come as PDFs, scanned images, Word docs, ZIPs with inconsistent structure — extraction approach (text parsing vs. OCR vs. LLM-based) needs validation against real samples before Phase 2 scoping.
- **Internal knowledge base format/ingestion:** What format does each client's existing material exist in today (Word, PDF, scattered files)? Needs a defined ingestion/curation process before drafting can be reliable — garbage in, garbage out.
- **Draft quality validation:** No automated way to measure "is this a good first draft" — likely needs human-in-the-loop rating/feedback initially, and a clear expectation-setting (draft = starting point, not submission-ready) to avoid over-trust.
- **Relevance filtering precision:** CPV codes and keyword matching may produce false positives/negatives; tuning this will require user feedback loops, which don't exist yet.
- **Multi-tenant data model:** Every table (tenders, KB docs, drafts, filters) needs a tenant/org scope with RLS enforcement (Supabase) — must be designed in from V1, not bolted on later.
- **Volume/cost of LLM usage:** Extraction and drafting at scale (especially Phase 2 full-document parsing) could become a meaningful per-tender cost — needs early estimation.
