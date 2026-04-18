# Progress

## Session log

### 2026-04-11T13:36:42Z

- Initialized stage artifacts.
- Replace this with a real progress log entry.

### 2026-04-16T20:49:49Z

- Re-synced `docs/roadmap.md`, `docs/PRD-MVP.md`, `docs/architecture/frontend-architecture.md`, and the user-provided Draw.io flow before freezing Stage 02.
- Imported the editable Draw.io source into `docs/design/diagrams/customer-admin-bootstrap-flow.drawio`.
- Created `docs/design/customer-admin-bootstrap-flow.md` as the canonical interpretation of the broad flow for the current MVP roadmap.
- Clarified the stage boundary implied by the diagram:
  - `Stage 02` owns platform foundation plus product-shaped runtime shells;
  - `Stage 03` owns real auth / RBAC / org hierarchy / contracts / equipment / contractor invite activation;
  - `Stage 04` still owns live request flow activation;
  - later TO/MO schedule coordination and materials remain later operational work, nearest current home `Stage 05`;
  - modernization and supply branches from the imported diagram stay outside the current MVP scope unless the roadmap changes.
- Replaced the placeholder Stage 02 spec, feature list, and sprint contract with a real pre-build freeze centered on `slice-001-web-runtime-auth-onboarding-shell`.
- Stage 02 remains in pre-build state: no implementation evidence or fresh verifier pass has been collected yet.

### 2026-04-16T22:10:51Z

- Re-synced AGENTS, roadmap, documentation workflow, current stage artifacts, UI source-of-truth docs, and git history before touching code.
- Captured before-change smoke for `apps/web` on pinned Node `24.14.1` and recorded the pre-change route baseline:
  - `/` served the old Stage 01 landing page;
  - `/login` and `/register` returned `404`;
  - backend smoke remained blocked by missing `go` in the current shell.
- Ran Wave 1 explorers for:
  - frontend scaffold / Storybook inventory;
  - backend dev-run / Swagger / seed baseline;
  - CI / smoke / automation baseline.
- Confirmed real sprint-contract drift and re-froze the stage artifacts so `slice-001` now proves only the first runnable web runtime shell and does not falsely claim health/CI/root-dev/apps-field proof.
- Implemented `slice-001-web-runtime-auth-onboarding-shell` in `apps/web`:
  - root route now redirects to `/login`;
  - added public runtime routes `/login`, `/register`, `/company`, `/equipment`, `/contracts`, `/requests`;
  - built a shared runtime shell on top of Stage 01 `AppShell`, `SidebarNav`, `TopBar`, `Breadcrumbs`, `PageHeader`, `Card`, `Badge`, `Button`, `InputField`, and `ConsentRow`;
  - added `shared/config/env.ts` and `shared/api/runtime-shell.ts` as explicit env/API bootstrap boundaries;
  - kept `requests` as a truthful gated placeholder only;
  - normalized public web `contracts` naming over backend `agreements` inside the web bootstrap boundary.
- Synced canonical docs for the changed slice:
  - `docs/design/customer-admin-bootstrap-flow.md`
  - `docs/architecture/frontend-architecture.md`
- Collected evidence and raw artifacts for:
  - Storybook component lookup;
  - route walk;
  - route H1 snapshots;
  - UI review result;
  - final `web:smoke` output.
- Fresh verifier verdict recorded: `PASS`.
- Proven now:
  - `stage02-web-runtime-shell`
  - `stage02-auth-onboarding-shell`
  - `stage02-equipment-contract-shells`
  - `stage02-doc-sync-and-proof`
- Still open inside Stage 02:
  - `stage02-platform-baseline` (backend health endpoint, root dev/startup contract, CI workflow, `apps/field` scaffold).

### 2026-04-18T07:06:08Z

- Re-synced AGENTS, documentation workflow, Stage 02 artifacts, frontend/source-of-truth docs, and the already-open Stage 03 handoff before closing the remaining platform tail.
- Re-froze Stage 02 onto `slice-002-platform-baseline-health-ci-field`.
- Landed the remaining platform baseline:
  - added root `Makefile`, `compose.platform.yml`, and `scripts/platform_smoke.sh` as the reproducible startup/smoke contract;
  - added container-backed backend `go test ./...` and `go build ./...` scripts so proof no longer depends on local `go`;
  - added backend `healthz` / `readyz` endpoints and structured request/runtime logs;
  - added `apps/field` as a PWA-first scaffold with manifest, API/sync boundary copy, and accessibility-safe shell details;
  - added CI workflow `.github/workflows/platform-baseline.yml` for frontend smoke, backend container checks, and full stack smoke.
- Synced canonical docs for the changed slice:
  - `README.md`
  - `docs/onboarding.md`
  - `docs/testing/test-strategy.md`
  - `docs/architecture/source-of-truth.md`
  - `docs/architecture/frontend-architecture.md`
  - `docs/architecture/platform-runtime-baseline.md`
- Refreshed downstream Stage 03 handoff artifacts so they no longer describe `stage02-platform-baseline` as an open tail.
- Collected raw proof for harness check, Storybook lookup, UI review, web smoke, field smoke, backend container test/build, compose status, backend/web/field logs, health/readiness JSON, seeded API reads, web route walk, and field manifest.
- Fresh verifier verdict recorded: `PASS`.
- Proven now:
  - `stage02-platform-baseline`
  - all Stage 02 feature list items.

### 2026-04-18T07:43:19Z

- Ran a post-review fix cycle before commit after validating the compose-backed stack against the frozen Stage 02 contract.
- Closed two proof gaps that were not covered by the previous smoke floor:
  - login/register submit buttons advertised a transition into the runtime shell but actually reloaded the same route;
  - `/company` and `apps/field` showed build-time default env values instead of the live compose runtime boundary.
- Fixed the shell flow by making auth/register submit continue to `/company`.
- Fixed env truthfulness by rendering the web company page and the field root page dynamically from runtime env instead of baking `localhost/stub` during image build.
- Kept Storybook-backed auth form primitives route-agnostic by moving submit navigation into `app/login` and `app/register` instead of embedding router state into reusable form components.
- Strengthened `scripts/platform_smoke.sh` so future proof requires:
  - `http://backend:8080` and `seed-read` on `/company`;
  - `http://backend:8080` and `queue-preview` on `apps/field`.
- Refreshed raw proof outputs for web smoke, field smoke, backend container test/build, compose status/logs, API reads, route walk, field manifest, and stack smoke.

### 2026-04-18T08:06:58Z

- Closed the remaining Stage 02 startup/smoke reliability gap on the current branch.
- Found branch-local drift in the owned root contract:
  - `Makefile` had dropped compose `--wait` from `make dev`, which let the stack report success before the Stage 02 health gate was reached.
- Restored the intended root startup contract by putting compose `--wait` back on `make dev`.
- Hardened `scripts/platform_smoke.sh` with a bounded readiness loop against host-facing backend/web/field routes so immediate `make smoke` no longer fails on transient `Connection refused` while published ports catch up to container health.
- Re-synced the canonical runtime docs:
  - `README.md`
  - `docs/onboarding.md`
  - `docs/architecture/platform-runtime-baseline.md`
- Narrowed the surrounding Stage 02 contract/docs so they match the implemented proof:
  - `docs/roadmap.md` now stops short of claiming Stage 02 error-reporting hooks or live auth/session bootstrap for web/field;
  - `README.md`, `docs/onboarding.md`, and `docs/architecture/platform-runtime-baseline.md` now explain that `make down` preserves the named Postgres volume, `make clean` is the clean-room reset path, and `make smoke` requires `python3`;
  - `apps/field` and architecture docs now describe the field contour as a manifest-backed shell instead of implying browser-installability without PWA icons;
  - `CONTRIBUTING.md` and `docs/testing/test-strategy.md` were aligned with the current repo-level CI/runtime baseline and accepted UI-proof shape.
- Refreshed Stage 02 proof with a clean startup cycle:
  - `make down > raw/slice-002-startup-reset.txt`
  - `make dev > raw/slice-002-startup-make-dev.txt`
  - `make smoke > raw/slice-002-platform-smoke.txt`
  - `docker compose -f compose.platform.yml ps > raw/slice-002-compose-ps.txt`

### 2026-04-18T09:33:06Z

- Re-opened Stage 02 proof after external review flagged one remaining gap: no automated browser smoke proved the client-side submit path from `/login` and `/register` into `/company`.
- Added Playwright-based browser smoke to `apps/web` and moved it into the authoritative root `pnpm run web:smoke` path instead of leaving the flow implied by static route HTML.
- Wired `frontend-workspaces` CI to install Playwright Chromium before running `pnpm run web:smoke`, so the browser proof is reproduced in GitHub Actions on the same branch.
- Synced canonical runtime docs for the changed verification contract:
  - `README.md`
  - `docs/onboarding.md`
  - `docs/architecture/platform-runtime-baseline.md`
- Refreshed Stage 02 raw proof for both the aggregate frontend smoke bundle and the dedicated auth browser flow:
  - `raw/slice-002-web-smoke.txt`
  - `raw/slice-002-web-browser-smoke.txt`

### Remaining

- No open proof gaps remain inside Stage 02.

### Next recommended sprint contract

- `03-identity-master-data / slice-001-first-admin-activation-and-org-graph`
