# API Contract (UI view)

Mirror of the backend endpoints this UI calls. Source of truth: backend repo `docs/specs/api.md` and the pipeline specs.
When the backend changes, update this file, `models/`, `api/`, and `mocks/` together.

All requests are same-origin `/api/**` (dev proxy / nginx → `:8080`) with the session cookie. `401` → login redirect.

## Live

| Method | Path | UI caller | Mocked |
|---|---|---|---|
| GET | `/api/applications?appliedAfter&companyName&offerStatus&resumeVersion&platform` | `ApplicationApiService.search` | yes |
| PUT | `/api/applications/{id}` | `.update` | yes |
| PATCH | `/api/applications/{id}/mark?value=1..5` | `.mark` | yes |
| DELETE | `/api/applications/{id}` | `.delete` | yes |

Errors: `404` unknown id, `400` invalid `mark` / enum / date.

Not used by the UI yet: `GET /api/me`, `POST /api/jobs/sync` (Gmail sync button: planned), `GET /api/mails/search`.

## Backend live, not used by the UI yet (phase 1)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/postings` `{company?, title?, url?, jdText}` | `201`; the same JD again → the existing posting |
| GET | `/api/postings?stage` | list (no `jdText` / `parsed` / `match`) |
| GET | `/api/postings/{id}` | detail incl. `parsed`, `match` |
| POST | `/api/postings/{id}/score` | calls Claude; `502` on LLM failure (text body), `409` if past `SHORTLISTED` |
| POST | `/api/postings/{id}/skip` `{reason?}` | |

Enums are **uppercase** (`APPLY`/`MAYBE`/`SKIP`, `BLOCKER`/`MAJOR`/`MINOR`).

## Planned (pipeline)

Shapes are defined in the backend specs; add them here when the backend ships them.

| Method | Path | Page | Backend spec |
|---|---|---|---|
| POST | `/api/postings/fetch` | Postings | job-sourcing |
| GET/POST/PUT/DELETE | `/api/watched-companies` | Sources | job-sourcing |
| GET | `/api/postings/{id}/review` | Review | review-and-apply |
| POST | `/api/postings/{id}/approve` · `/regenerate` · `/reject` | Review | review-and-apply |
| PUT | `/api/tailored-documents/{id}/bullets/{index}` | Review | review-and-apply |
| POST | `/api/postings/{id}/apply/prefill` · `/mark-submitted` | Review | review-and-apply |
| GET | `/api/agent/runs` · `/api/agent/runs/{id}` | Agent report | agent |
| GET | `/api/llm/usage?from&to` | Usage | llm-platform |

## Types to add (when the endpoints ship)

```ts
type PostingStage = 'NEW' | 'PARSED' | 'SCORED' | 'SKIPPED' | 'SHORTLISTED' | 'TAILORED'
  | 'APPROVED' | 'SUBMITTED' | 'REJECTED_BY_USER';

interface JobPosting {
  id: number; company: string; title: string; url?: string; location?: string;
  stage: PostingStage; skipReason?: string;
  seniority?: string; remote?: string; visa?: string; salaryMin?: number; salaryMax?: number;
  score?: number; recommendation?: 'APPLY' | 'MAYBE' | 'SKIP';
  createdAt: string; updatedAt: string;
}

interface MatchResult {
  score: number;
  dimensionScores: { skills: number; experienceLevel: number; domain: number; logistics: number };
  matchedRequirements: { requirement: string; evidenceFactIds: string[] }[];
  gaps: { requirement: string; severity: 'BLOCKER' | 'MAJOR' | 'MINOR'; suggestion: string }[];
  recommendation: 'APPLY' | 'MAYBE' | 'SKIP';
  reasoning: string;
}
```
