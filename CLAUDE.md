# CLAUDE.md

Guide for AI agents working in this repo. Read this first, then the spec for the area you touch.

## What this is

`job-mail-scan-console`: the Angular UI for the `job-mail-scan` Spring Boot backend
(`~/AnpProjects/job-mail-scan`, GitHub `dmq23333/mail-scan`). Today it shows the job applications that the backend
syncs from Gmail. It's growing into the review console for the job pipeline (postings → scores → tailored resumes →
human approval → apply). See [docs/specs/pages.md](docs/specs/pages.md).

The backend's `docs/` is the source of truth for the API and pipeline design. This repo's
[docs/specs/api-contract.md](docs/specs/api-contract.md) mirrors only what the UI calls.

## Stack

- Angular 20: standalone components, **zoneless** change detection (`provideZonelessChangeDetection`), signals
- RxJS for HTTP only; state lives in signals in facades
- MSW 2 for mock API in dev
- Karma + Jasmine tests; nginx image for prod (`Dockerfile`, `compose.yaml`)

## Commands

```bash
npm start            # ng serve + proxy /api → http://localhost:8080
npm start -- --open  # then visit /?mock=1 to turn MSW on (/?mock=0 to turn it off; the choice is kept in localStorage)
npm test
npm run build
docker compose up --build -d   # prod build on :4200, /api → host :8080
```

## Layout and layering

```
src/app/
  models/        TypeScript types mirroring backend DTOs (*.model.ts)
  api/           *-api.service.ts: HttpClient calls only, one per backend resource
  service/       *.service.ts: thin pass-through to api (place for mapping if DTO ≠ view model)
  facade/        *.facade.ts: signals state (data, loading, error) + actions; components talk only to facades
  page/<name>/   routed page components (lazy-loaded in app.routes.ts)
  interceptors/  auth.interceptor.ts: on 401, redirect to backend Google login
  mocks/         MSW handlers.ts + data/*.ts
```

Calls go page → facade → service → api. Don't call `HttpClient` from components or facades.

## Conventions

- **Every new backend endpoint the UI calls gets an MSW handler** in `mocks/handlers.ts` with realistic data in
  `mocks/data/`, matching the backend's status codes (404 unknown id, 400 validation). The UI must work with `?mock=1`.
- Models mirror backend JSON field names exactly (camelCase), with optional `?` where the backend can return null.
- Enums are string-literal unions (`OfferStatus`), kept in sync with the backend enum. `ALL` is a filter sentinel,
  never a stored value; the frontend models it as `'ALL'` only in filter state.
- 2-space indent, single quotes (`.editorconfig`).
- Signals for component state; `computed` for derived lists. No `NgZone`, no `ChangeDetectorRef.detectChanges`.

## Pipeline UI rules (hard)

- The UI never submits a job application. "Apply" opens or pre-fills the employer's form; the user submits there,
  then clicks **Mark submitted** here.
- Never show tailored resume text the backend marked `REJECTED_BY_VERIFIER` as if it were usable; show the rejection reasons.
- **Approve** is an explicit click per posting. No bulk approve.

## Known gaps

- `auth.interceptor.ts` hard-codes `http://localhost:8080/oauth2/authorization/google`; this should become a relative
  `/oauth2/authorization/google` once the proxy forwards `/oauth2` and `/login` too.
