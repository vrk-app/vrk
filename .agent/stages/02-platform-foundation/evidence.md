# Evidence

- Stage ID: 02-platform-foundation
- Sprint Contract: `slice-002-platform-baseline-health-ci-field`

## Commands run

- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 02-platform-foundation`
- `python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "field engineer offline shell status cards sync queue scaffold mobile contour" --limit 12`
- `curl -fsSL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run web:browser-install`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run web:smoke`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run web:browser-smoke`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run field:smoke`
- `./scripts/backend_go_test.sh`
- `./scripts/backend_go_build.sh`
- `make dev`
- `make smoke`
- `make down > .agent/stages/02-platform-foundation/raw/slice-002-startup-reset.txt 2>&1`
- `make dev > .agent/stages/02-platform-foundation/raw/slice-002-startup-make-dev.txt 2>&1`
- `make smoke > .agent/stages/02-platform-foundation/raw/slice-002-platform-smoke.txt 2>&1`
- `docker compose -f compose.platform.yml ps > .agent/stages/02-platform-foundation/raw/slice-002-compose-ps.txt`
- `docker compose -f compose.platform.yml ps`
- `docker compose -f compose.platform.yml logs --tail=200 backend web field`
- `curl` for `healthz`, `readyz`, seeded organizations/equipment reads, web route walk, and field manifest
- `pnpm run web:smoke > .agent/stages/02-platform-foundation/raw/slice-002-web-smoke.txt 2>&1`
- `pnpm run web:browser-smoke > .agent/stages/02-platform-foundation/raw/slice-002-web-browser-smoke.txt 2>&1`

## Tests run

- `pnpm run web:smoke`: PASS
- `pnpm run web:browser-smoke`: PASS
- `pnpm run field:smoke`: PASS
- `./scripts/backend_go_test.sh`: PASS
- `./scripts/backend_go_build.sh`: PASS
- `make dev`: PASS
- `make smoke`: PASS
- `make dev` from a fresh `make down`, with compose `--wait`: PASS
- immediate `make smoke` from that fresh startup: PASS

## Platform/runtime flows exercised

- backend `healthz` and `readyz`
- seeded `organizations` and `equipment` API reads through the compose-backed stack
- web runtime route walk for `/login`, `/register`, `/company`, `/equipment`, `/contracts`, `/requests`
- client-side submit flow `/login` -> `/company` and `/register` -> `/company` via headless browser smoke against the built Next runtime
- field runtime root page and `/manifest.webmanifest`
- structured backend request/runtime logging through the compose stack

## Artifacts collected

- `raw/slice-002-harness-check.txt`
- `raw/slice-002-storybook-lookup.txt`
- `raw/slice-002-web-interface-guidelines-source.md`
- `raw/slice-002-ui-review.txt`
- `raw/slice-002-web-smoke.txt`
- `raw/slice-002-web-browser-smoke.txt`
- `raw/slice-002-field-smoke.txt`
- `raw/slice-002-backend-go-test.txt`
- `raw/slice-002-backend-go-build.txt`
- `raw/slice-002-startup-reset.txt`
- `raw/slice-002-startup-make-dev.txt`
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

- `docs/roadmap.md`
- `CONTRIBUTING.md`
- `README.md`
- `docs/onboarding.md`
- `docs/testing/test-strategy.md`
- `docs/architecture/source-of-truth.md`
- `docs/architecture/frontend-architecture.md`
- `docs/architecture/platform-runtime-baseline.md`
- `apps/field/README.md`

## Downstream handoff synced

- `.agent/stages/03-identity-master-data/stage_spec.md`
- `.agent/stages/03-identity-master-data/sprint_contract.md`
- `.agent/stages/03-identity-master-data/progress.md`

## Notes / limitations

- Post-review fix cycle refreshed proof after closing two gaps:
  - login/register submit now continues into `/company` instead of reloading the same shell page;
  - `/company` and `apps/field` now render runtime env boundaries from the live container process, and `scripts/platform_smoke.sh` asserts those values.
- Startup/smoke reliability fix refreshed proof after closing the root path gap:
  - restored compose `--wait` in root `make dev`;
  - added a bounded host-port readiness wait in `scripts/platform_smoke.sh` so immediate post-start smoke does not fail on transient `Connection refused` while published ports catch up to container health.
- Stage 02 docs were narrowed where the earlier wording overstated the proven slice:
  - `make down` is not a clean-room reset; that role now belongs explicitly to `make clean`;
  - field proof is a manifest-backed shell, not full browser-installability proof;
  - roadmap/runtime docs now describe truthful auth/session boundaries rather than live bootstrap.
- Browser proof is now explicit rather than inferred from route HTML:
  - `apps/web` carries Playwright browser smoke for `/login` and `/register` submit flows into `/company`;
  - root `pnpm run web:smoke` and the `frontend-workspaces` CI job both execute that flow.
- Final routing ownership stays in `apps/web/app/login/page.tsx` and `apps/web/app/register/page.tsx`, so Storybook-backed auth form primitives remain reusable and do not need route-specific client logic.
- `apps/web` auth/session remains shell-only until Stage 03.
- `apps/field` remains a truthful PWA-first scaffold; offline draft storage, retry queue state, and conflict handling stay out of Stage 02.
- Backend resource naming still uses `agreements`; public web runtime keeps the normalized `contracts` boundary.
- Host ports for the compose-backed stack are configurable through `BACKEND_HOST_PORT`, `WEB_HOST_PORT`, and `FIELD_HOST_PORT`, with defaults `18080`, `3100`, and `3102`.
