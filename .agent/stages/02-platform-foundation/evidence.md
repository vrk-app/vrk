# Evidence

- Stage ID: 02-platform-foundation
- Sprint Contract: `slice-002-platform-baseline-health-ci-field`

## Commands run

- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 02-platform-foundation`
- `python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "field engineer offline shell status cards sync queue scaffold mobile contour" --limit 12`
- `curl -fsSL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run web:smoke`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run field:smoke`
- `./scripts/backend_go_test.sh`
- `./scripts/backend_go_build.sh`
- `make dev`
- `make smoke`
- `docker compose -f compose.platform.yml ps`
- `docker compose -f compose.platform.yml logs --tail=200 backend web field`
- `curl` for `healthz`, `readyz`, seeded organizations/equipment reads, web route walk, and field manifest

## Tests run

- `pnpm run web:smoke`: PASS
- `pnpm run field:smoke`: PASS
- `./scripts/backend_go_test.sh`: PASS
- `./scripts/backend_go_build.sh`: PASS
- `make dev`: PASS
- `make smoke`: PASS

## Platform/runtime flows exercised

- backend `healthz` and `readyz`
- seeded `organizations` and `equipment` API reads through the compose-backed stack
- web runtime route walk for `/login`, `/register`, `/company`, `/equipment`, `/contracts`, `/requests`
- field runtime root page and `/manifest.webmanifest`
- structured backend request/runtime logging through the compose stack

## Artifacts collected

- `raw/slice-002-harness-check.txt`
- `raw/slice-002-storybook-lookup.txt`
- `raw/slice-002-web-interface-guidelines-source.md`
- `raw/slice-002-ui-review.txt`
- `raw/slice-002-web-smoke.txt`
- `raw/slice-002-field-smoke.txt`
- `raw/slice-002-backend-go-test.txt`
- `raw/slice-002-backend-go-build.txt`
- `raw/slice-002-compose-ps.txt`
- `raw/slice-002-platform-logs.txt`
- `raw/slice-002-platform-smoke.txt`
- `raw/slice-002-healthz.json`
- `raw/slice-002-readyz.json`
- `raw/slice-002-organizations.json`
- `raw/slice-002-equipment.json`
- `raw/slice-002-web-route-walk.txt`
- `raw/slice-002-login-h1.txt`
- `raw/slice-002-register-h1.txt`
- `raw/slice-002-company-h1.txt`
- `raw/slice-002-equipment-h1.txt`
- `raw/slice-002-contracts-h1.txt`
- `raw/slice-002-requests-h1.txt`
- `raw/slice-002-field-h1.txt`
- `raw/slice-002-field-manifest.json`

## UI workflow proof

- Brief source: frozen `slice-002-platform-baseline-health-ci-field` contract plus `docs/architecture/frontend-architecture.md`, `docs/design/ui-workflow.md`, `docs/design/serviceops-design-system.md`, and `.impeccable.md`
- Lookup query: `field engineer offline shell status cards sync queue scaffold mobile contour`
- Matched story refs:
  - `Layout/AppShell`
  - `Layout/SidebarNav`
  - `Layout/TopBar`
  - `Layout/Breadcrumbs`
  - `Requests/RequestStatusBadge`
- Reuse decision:
  - `reuse`: layout/state patterns and semantic token language from the existing Storybook-backed shell inventory
  - `extend`: none
  - `create`: no new reusable cross-workspace component family; `apps/field` stays page-local and avoids premature shared-package extraction
- Changed UI files:
  - `apps/field/app/layout.tsx`
  - `apps/field/app/page.tsx`
  - `apps/field/app/globals.css`
  - `apps/field/app/manifest.ts`
  - `apps/field/shared/config/env.ts`
- `$web-design-guidelines` result: no findings recorded in `raw/slice-002-ui-review.txt`

## Canonical docs synced

- `README.md`
- `docs/onboarding.md`
- `docs/testing/test-strategy.md`
- `docs/architecture/source-of-truth.md`
- `docs/architecture/frontend-architecture.md`
- `docs/architecture/platform-runtime-baseline.md`

## Downstream handoff synced

- `.agent/stages/03-identity-master-data/stage_spec.md`
- `.agent/stages/03-identity-master-data/sprint_contract.md`
- `.agent/stages/03-identity-master-data/progress.md`

## Notes / limitations

- Post-review fix cycle refreshed proof after closing two gaps:
  - login/register submit now continues into `/company` instead of reloading the same shell page;
  - `/company` and `apps/field` now render runtime env boundaries from the live container process, and `scripts/platform_smoke.sh` asserts those values.
- Final routing ownership stays in `apps/web/app/login/page.tsx` and `apps/web/app/register/page.tsx`, so Storybook-backed auth form primitives remain reusable and do not need route-specific client logic.
- `apps/web` auth/session remains shell-only until Stage 03.
- `apps/field` remains a truthful PWA-first scaffold; offline draft storage, retry queue state, and conflict handling stay out of Stage 02.
- Backend resource naming still uses `agreements`; public web runtime keeps the normalized `contracts` boundary.
- Host ports for the compose-backed stack are configurable through `BACKEND_HOST_PORT`, `WEB_HOST_PORT`, and `FIELD_HOST_PORT`, with defaults `18080`, `3100`, and `3102`.
