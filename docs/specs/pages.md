# Pages Spec

Order follows the backend build plan: days 1–3 scoring, 4–7 tailoring, 8–10 sourcing, 11–14 this UI.

## Live

### Applications `/applications`
Gmail-synced applications: status filter chips + stats, search panel (date, company, status, resume version, platform),
inline edit, 1–5 star mark, delete. Data: `ApplicationFacade`.

## Planned (days 11–14)

### Postings `/postings`
- Table: company, title, location, stage, score, recommendation, an **already applied** badge, and fetched date.
- Filters: stage, min score, company. Default view: `SHORTLISTED` sorted by score desc.
- Actions: **Add posting** (paste JD text, for postings not covered by sourcing), **Fetch now**, **Skip** with a reason.
- Facade: `PostingFacade` (list, filters, loading, error).

### Posting detail `/postings/:id`
- Parsed JD fields (seniority, remote, visa, salary, must-have / nice-to-have skills).
- Match: score + dimension bars, matched requirements with evidence fact ids, gaps by severity, reasoning.
- Actions: **Re-score**, **Tailor** (when `SHORTLISTED`), **Skip**.

### Review `/postings/:id/review`: the core page
Layout: JD summary | resume diff | cover letter.
- **Resume diff**: master vs. tailored, per bullet. Mark reworded, reordered, and omitted bullets; hovering a bullet shows its
  `sourceFactIds` and the fact text.
- Verifier panel: pass/fail per check; if rejected, show the reasons and disable Approve.
- Inline edit a bullet → `PUT /api/tailored-documents/{id}/bullets/{index}` → re-verified → diff refreshes.
- Actions: **Approve**, **Regenerate** (with a note), **Reject** (with a reason).
- After approve: **Open & pre-fill** (backend launches the browser), then **Mark submitted** (creates the tracked application).
  Both buttons are shown only when `stage = APPROVED`.

### Board `/board`
Kanban by stage: `SHORTLISTED → TAILORED → APPROVED → SUBMITTED`, then application status from Gmail sync
(`APPLIED`, `VIEWED`, `INTERVIEW`, `REJECTED`). Cards needing a follow-up (no reply after N days) get a badge.
Drag is read-only for pipeline stages (they change only through actions); it's allowed only for application status overrides.

### Later
- Sources `/sources`: CRUD of watched companies (ATS type, slug, careers URL, selector, enabled).
- Agent report `/agent`: runs list, per-run decisions (posting, decision, reason), cost.
- Usage `/usage`: LLM cost per day per call type.

## Navigation

Top nav: Postings · Board · Applications (+ Sources, Agent, and Usage when they exist). Default route moves from
`/applications` to `/postings` once Postings ships.
