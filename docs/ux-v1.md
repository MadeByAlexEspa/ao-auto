# UX Design: ao-auto V1

See also: [docs/product-vision.md](./product-vision.md), [docs/prd-v1.md](./prd-v1.md)

## Core User Flow

```
ENTRY
  └─> Dashboard (relevant-only, sorted by soonest deadline)
        │
        ├─ Status counts visible at top (e.g. "12 new · 3 reviewed · 1 drafted · 0 submitted")
        ├─ Urgent flag highlights tenders <7 days to deadline (color varies by status)
        │
        ▼
TRIAGE (scan list)
        │
        ├─> [optional] Toggle "Show all" to see entire catalog
        ├─> [optional] Sort by other columns (deadline default)
        │
        ▼
REVIEW (click row → Detail view)
        │
        ├─ Read extracted fields (title, buyer, deadline, scope, CPV, contact, submission method)
        ├─ Open original BOAMP notice (external link) if extraction insufficient
        │
        ▼
STATUS UPDATE (on detail view)
        │
        ├─ new → reviewed → drafted → submitted (non-sequential allowed)
        │
        ▼
RETURN to dashboard (status reflected, counts updated, urgency color updated)

SIDE PATH (infrequent)
  Dashboard/nav → Filter Settings → edit CPV/keywords/geography → Save
        └─> async recompute (toast: "Filters saved — your relevant tender list is updating")
```

## Screen 1: Dashboard / Tender List

```
┌──────────────────────────────────────────────────────────────────────┐
│ ao-auto                                          [Filter Settings] [↻]│
├──────────────────────────────────────────────────────────────────────┤
│  Status: ● 12 New   ● 3 Reviewed   ● 1 Drafted   ● 0 Submitted        │
├──────────────────────────────────────────────────────────────────────┤
│  ( Relevant only )  Show all ▢                       Sort: Deadline ▾ │
├──────────────────────────────────────────────────────────────────────┤
│ ⚠ │ Deadline    │ Title                  │ Buyer        │ CPV   │Status│
├───┼─────────────┼────────────────────────┼──────────────┼───────┼─────┤
│ 🔴│ 2026-06-18  │ Nettoyage locaux ...   │ Mairie de ... │ 90910 │ NEW │
│   │ 2026-06-22  │ Maintenance espaces... │ CD du Rhône   │ 77310 │ NEW │
│ 🟠│ 2026-06-20  │ Audit énergétique ...  │ Région ...    │ 71314 │ REV │
│   │ 2026-07-02  │ Fourniture matériel... │ CHU ...       │ 33100 │ NEW │
│   │ 2026-07-15  │ Travaux voirie ...     │ Métropole...  │ 45233 │ DFT │
└──────────────────────────────────────────────────────────────────────┘
                                                        [Load more / pagination]
```

**Hierarchy:** Deadline + urgency flag (most prominent) → Title/Buyer/Status (secondary, scan-readable) → CPV (tertiary). Status-count bar sticky at top. "Relevant only / Show all" defaults to relevant-only, low visual weight. Manual sync (↻) small, top-right. Entire row is the click target → detail view.

**CPV display:** primary CPV code + short label (e.g. "90910 — Nettoyage"), "+2 more" if multiple; full list in detail view. Static code→label lookup table.

## Screen 2: Tender Detail View

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to dashboard                                                    │
├──────────────────────────────────────────────────────────────────────┤
│  Nettoyage des locaux administratifs — Mairie de Lyon                 │
│  🔴 Deadline: 18 June 2026, 17:00          Status: [ NEW ▾ ]          │
├──────────────────────────────────────────────────────────────────────┤
│  Buyer        │ Mairie de Lyon                                         │
│  CPV code(s)  │ 90910000 — Nettoyage                                   │
│  Submission   │ Plateforme PLACE (dématérialisée)                      │
│  Contact      │ marchespublics@lyon.fr / +33 4 XX XX XX XX             │
├──────────────────────────────────────────────────────────────────────┤
│  Scope summary                                                         │
│  ─────────────                                                         │
│  Lorem ipsum extracted scope description, multi-paragraph, read-only. │
├──────────────────────────────────────────────────────────────────────┤
│  🔗 View original BOAMP notice                                         │
└──────────────────────────────────────────────────────────────────────┘
```

**Hierarchy:** Title + deadline + status dropdown (header, primary action) → key-fact table (buyer, CPV, submission method, contact) → scope summary (longest read) → link to original notice (escape hatch, styled as link).

Missing fields render as "Not available" (muted text), never hidden. Status dropdown allows any transition, no confirmation modal (low-stakes internal state).

## Screen 3: Filter Settings

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to dashboard                                                    │
├──────────────────────────────────────────────────────────────────────┤
│  Relevance Filters                                                     │
│  Tenders matching these criteria appear in your "relevant" list.      │
├──────────────────────────────────────────────────────────────────────┤
│  CPV Codes (prefix match)                                              │
│  [ 90910 ] [ 77310 ] [ + Add ]                                         │
│                                                                         │
│  Keywords (match title/description)                                   │
│  [ nettoyage ] [ entretien espaces verts ] [ + Add ]                   │
│                                                                         │
│  Geography (department/region — optional)                             │
│  [ Rhône (69) ] [ Auvergne-Rhône-Alpes ] [ + Add ]                     │
├──────────────────────────────────────────────────────────────────────┤
│  ℹ A tender matches if it matches any CPV OR any keyword,             │
│    AND matches geography (if geography is set).                       │
├──────────────────────────────────────────────────────────────────────┤
│                                              [ Cancel ]  [ Save ]      │
└──────────────────────────────────────────────────────────────────────┘
```

Chip/tag inputs for each category. Plain-language matching-logic note always visible. Save triggers async recompute with toast feedback. Geography optional. Empty CPV/keywords shows placeholder: "No CPV codes added — add at least one filter category to see relevant tenders."

## Resolved Decisions

1. **"Show all" scope**: entire global catalog. Tenders with no `tender_org_status` row show "—" for relevance/status.
2. **Urgency flag**: persists across statuses with color change — 🔴 red if `new` + <7 days, 🟠 amber if `reviewed`/`drafted` + <7 days, gone once `submitted`.
3. **Filter save recompute**: async — save returns immediately, toast notifies "Filters saved — your relevant tender list is updating", dashboard reflects changes once recompute completes.
4. **CPV display**: raw code + label from a static lookup table; primary code shown + "+N more" on dashboard, full list in detail view.

## Conventions

- **Status badges**: new (gray) → reviewed (blue) → drafted (amber) → submitted (green). Abbreviated (NEW/REV/DFT/SUB) on dashboard, full word in detail dropdown. Pill + dropdown, not a locked progress bar (non-sequential transitions allowed).
- **Empty states**:
  - No relevant tenders: "No relevant tenders right now. [Adjust your filters →]"
  - No tenders collected yet: "No tenders collected yet. Sync runs automatically, or [trigger manual sync]."
  - No filters configured: placeholder prompting to add at least one CPV/keyword.
- **Missing field data**: "Not available" in muted text, stable layout.

## Open items for story-writing
- Catalog size per org (affects pagination/virtualization decision — assume simple full-list render for V1 pilot scale unless told otherwise).
