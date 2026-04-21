# Evidence

- Stage ID: `03-identity-master-data`
- Sprint Contract IDs:
  - `slice-007-stage03-admin-surface-auth-hardening`
  - `slice-008-stage03-multi-org-session-contract`

## Commands run

- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
- `PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH /Users/yura-posledov/cursor/vrk/.agent/tmp-tools/sqlc generate -f apps/backend/sqlc.yaml`
- `cd apps/backend && env PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH go test ./...`
- `cd apps/backend && env PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH go build -buildvcs=false ./...`
- `make clean`
- `make dev`
- `docker compose -f compose.platform.yml up --build -d --wait web`
- `python3 -m py_compile .agent/stages/03-identity-master-data/proof_slice007_008_auth_contract.py`
- `python3 .agent/stages/03-identity-master-data/proof_slice007_008_auth_contract.py`
- `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run typecheck`
- `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run lint`
- `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run build`
- review the touched auth/bootstrap UI against `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
- launch one brand-new fresh verifier leaf for the refreshed `slice-007` + `slice-008` bundle and wait for a harvestable verdict

## Proof summary

- Harness validation: `PASS`
  - current orchestrator refresh: `.agent/stages/03-identity-master-data/raw/slice-007-008-harness-check-2026-04-21-orchestrator-rerun9.txt`
  - fresh verifier post-verdict check: `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-harness-post-verdict-2026-04-21.txt`
- `sqlc generate`: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-007-008-sqlc-generate-2026-04-21-orchestrator-rerun.txt`
- Backend `go test ./...`: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-007-008-backend-go-test-2026-04-21-orchestrator-rerun.txt`
- Backend `go build -buildvcs=false ./...`: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-007-008-backend-go-build-2026-04-21-orchestrator-rerun.txt`
- Swagger/OpenAPI: no new backend schema delta was required after the auth/session hardening landed; refreshed artifacts from `2026-04-20` remain current for this slice.
  - raw: `.agent/stages/03-identity-master-data/raw/slice-007-008-swagger-refresh-2026-04-20-orchestrator.txt`
- Clean runtime floor: `PASS`
  - the dirty compose DB state was cleared with `make clean`;
  - the fixed migration path boots cleanly through `make dev` on a fresh volume;
  - raw:
    - `.agent/stages/03-identity-master-data/raw/slice-007-008-make-clean-2026-04-21-orchestrator.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-007-008-make-dev-2026-04-21-orchestrator-clean.txt`
- Local web checks after the accessibility follow-up fix: `PASS`
  - `pnpm run typecheck`: `.agent/stages/03-identity-master-data/raw/slice-007-008-web-typecheck-2026-04-21-orchestrator-rerun2.txt`
  - `pnpm run lint`: `.agent/stages/03-identity-master-data/raw/slice-007-008-web-lint-2026-04-21-orchestrator-rerun2.txt`
  - `pnpm run build`: `.agent/stages/03-identity-master-data/raw/slice-007-008-web-build-2026-04-21-orchestrator-rerun2.txt`
- Rebuilt runtime stack on the current dirty worktree: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-007-008-web-rebuild-2026-04-21-orchestrator-rerun3.txt`
- Proof script compile guard: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-007-008-proof-py-compile-2026-04-21-orchestrator-rerun4.txt`
- Primary targeted live auth proof via `proof_slice007_008_auth_contract.py`: `PASS`
  - current raw: `.agent/stages/03-identity-master-data/raw/slice-007-008-direct-auth-proof-2026-04-21-orchestrator-rerun7.txt`
  - current summary: `.agent/stages/03-identity-master-data/raw/slice-007-008-direct-summary-2026-04-21.json`
  - covered checks:
    - `GET /register` returns `200` and does not leak `PLATFORM_ADMIN_SHARED_SECRET` into HTML;
    - web `POST /api/platform/organization-shells` preserves backend `201`;
    - anonymous `POST /api/v1/platform/organization-shells` and anonymous `GET /api/v1/organizations` return `401`;
    - authorized `GET /api/v1/organizations` returns `200`;
    - first-admin invite issuance, acceptance, and launch wizard complete successfully;
    - stored session tokens restore the original `membership_id + grant_id`;
    - direct login with multiple eligible access paths returns truthful `409`.
- Current local UI review: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-007-008-ui-review-2026-04-21-orchestrator-rerun2.txt`
  - reviewed UI scope:
    - `apps/web/app/login/page.tsx`
    - `apps/web/app/register/[token]/page.tsx`
    - `apps/web/features/Stage03Bootstrap/ui/PlatformAdminInviteForm.tsx`
- Final brand-new fresh verifier outcome: `PASS`
  - `verdict.json` and `problems.md` were updated by the verifier with a usable final verdict;
  - fresh verifier artifacts:
    - `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-harness-post-verdict-2026-04-21.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-live-proof-2026-04-21.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-live-summary-2026-04-21.json`
    - `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-ui-review-2026-04-21.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-evidence-audit-2026-04-21.txt`
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-21-continuation-verifier.md`
  - verifier conclusion:
    - admin surface auth hardening still holds;
    - `/register` still keeps the platform-admin secret on the server boundary only;
    - session restore still returns the explicit stored `membership_id + grant_id`;
    - direct login still returns truthful `409` on multiple eligible access paths;
    - no workspace-picker widening was reproduced.
- Historical verifier-control-plane blockers are now chronology only:
  - `.agent/stages/03-identity-master-data/raw/slice-007-008-verifier-agent-blocked-2026-04-21-orchestrator-rerun3.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-007-008-verifier-agent-blocked-2026-04-21-orchestrator-rerun2.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-007-008-verifier-agent-blocked-2026-04-21-orchestrator.txt`

## Implemented contract closures

- `slice-007`
  - backend admin surface `/api/v1/organizations*` and backend `POST /api/v1/platform/organization-shells` require `X-VRK-Platform-Admin-Secret`;
  - backend config requires `PLATFORM_ADMIN_SHARED_SECRET`;
  - web `/register` continues to work through the server-side Next boundary without leaking the secret to browser code;
  - the web proxy preserves backend `201` on `POST /api/platform/organization-shells`.
- `slice-008`
  - `auth_sessions` store explicit `grant_id`;
  - direct login uses explicit access-path enumeration instead of arbitrary `LIMIT 1` selection;
  - `POST /api/v1/sessions` returns truthful `409` when multiple eligible access paths exist;
  - first-admin and employee invite acceptance issue sessions with explicit `grant_id`;
  - `GetCurrentSession` restores only through the stored `grant_id` and an active membership.
- Continuation-run hardening
  - `apps/backend/migrations/000010_stage03_session_explicit_grant_binding.up.sql` boots on Postgres without `MIN(uuid)`;
  - `.agent/stages/03-identity-master-data/proof_slice007_008_auth_contract.py` remains the canonical targeted live proof for `/register`, admin boundary enforcement, session restore, and truthful `409`;
  - `docs/onboarding.md` remains synced to the admin-surface `401` / `200` smoke split.

## UI workflow evidence

- Design/source-of-truth read:
  - `.impeccable.md`
  - `docs/design/serviceops-design-system.md`
  - `docs/design/ui-workflow.md`
  - `docs/design/storybook-component-backlog.md`
  - `docs/architecture/frontend-architecture.md`
- Storybook lookup:
  - query: `platform admin invite auth route proxy session conflict login restore register boundary`
  - result: existing auth/layout primitives cover the touched surfaces; no new reusable component family is justified
  - raw: `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-007-008-2026-04-20-orchestrator.txt`
- Reuse decision: `reuse`
- Current reviewed UI scope remains bounded and singular:
  - reviewed UI scope:
    - `apps/web/app/login/page.tsx`
    - `apps/web/app/register/[token]/page.tsx`
    - `apps/web/features/Stage03Bootstrap/ui/PlatformAdminInviteForm.tsx`
  - current note:
    - the async invite-issued success region now announces state changes with `aria-live="polite"` and `aria-atomic="true"`, closing the only reproduced UI finding from the last verifier pass
    - the final verifier reran the Web Interface Guidelines check and returned `PASS` on `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-ui-review-2026-04-21.txt`
  - historical note:
    - `.agent/stages/03-identity-master-data/raw/slice-007-008-final-final-verifier-ui-review-2026-04-21.txt` remains in `raw/` as a truthful historical artifact for the pre-fix failure, but it is no longer the current UI state

## Canonical docs synced

- `docs/roadmap.md`
- `docs/architecture/identity-master-data.md`
- `docs/architecture/frontend-architecture.md`
- `docs/onboarding.md`
- `apps/backend/docs/swagger/docs.go`
- `apps/backend/docs/swagger/swagger.json`
- `apps/backend/docs/swagger/swagger.yaml`

## Key artifacts updated

- `.agent/stages/03-identity-master-data/progress.md`
- `.agent/stages/03-identity-master-data/feature_list.json`
- `.agent/stages/03-identity-master-data/evidence.md`
- `.agent/stages/03-identity-master-data/evidence.json`
- `.agent/stages/03-identity-master-data/verdict.json`
- `.agent/stages/03-identity-master-data/problems.md`
- `.agent/stages/03-identity-master-data/proof_slice007_008_auth_contract.py`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-harness-check-2026-04-21-orchestrator-rerun9.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-sqlc-generate-2026-04-21-orchestrator-rerun.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-backend-go-test-2026-04-21-orchestrator-rerun.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-backend-go-build-2026-04-21-orchestrator-rerun.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-make-clean-2026-04-21-orchestrator.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-make-dev-2026-04-21-orchestrator-clean.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-web-typecheck-2026-04-21-orchestrator-rerun2.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-web-lint-2026-04-21-orchestrator-rerun2.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-web-build-2026-04-21-orchestrator-rerun2.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-web-rebuild-2026-04-21-orchestrator-rerun3.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-proof-py-compile-2026-04-21-orchestrator-rerun4.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-direct-auth-proof-2026-04-21-orchestrator-rerun7.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-direct-platform-shell-unauthorized-2026-04-21.json`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-direct-summary-2026-04-21.json`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-ui-review-2026-04-21-orchestrator-rerun2.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-harness-post-verdict-2026-04-21.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-live-proof-2026-04-21.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-live-summary-2026-04-21.json`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-ui-review-2026-04-21.txt`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-continuation-verifier-evidence-audit-2026-04-21.txt`
- `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-21-continuation-verifier.md`
- `.agent/stages/03-identity-master-data/raw/slice-007-008-verifier-agent-blocked-2026-04-21-orchestrator-rerun3.txt`
- `apps/backend/migrations/000010_stage03_session_explicit_grant_binding.up.sql`
- `apps/backend/internal/db/queries/auth/bootstrap.sql`
- `apps/backend/internal/db/generated/bootstrap.sql.go`
- `apps/web/shared/api/route-proxy.ts`
- `apps/web/app/api/platform/organization-shells/route.ts`
