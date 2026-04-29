# Evidence

- Stage ID: `03-identity-master-data`
- Current correction slice: `slice-010-stage03-org-structure-management`
- Current local-dev slice: `stage03-local-dev-seed`
- Builder state: `COMPLETE`
- Verifier state: `PASS_AFTER_DIVISION_ROLE_MODEL_V1`; local-dev seed proof collected by parent on 2026-04-29

This bundle records builder-collected proof, the minimal fixer doc-sync, and the historical post-fixer fresh verifier `PASS` for the 2026-04-29 Stage 03 correction that moves the product target from the historical launch wizard to persistent `/company` organization profile and structure management.

Newton later failed the legal-type correction only for documentation drift, and that doc-only gap was fixed. The latest user clarification confirms `division` is the intended API/domain term replacing `subdivision`; a fresh verifier reproduced the division-aligned proof and returned `PASS`. The follow-up Role Model v1 checkpoint verified the canonical role catalog, scope compatibility, v1 capability behavior, active terminology hard cutover, and full backend/web smoke gates.

The 2026-04-29 local-dev seed slice adds an operational developer workflow on top of the proven Stage 03 identity/org-structure APIs: `make dev` now runs a one-shot `dev-seed` service after compose health, creates a demo customer organization through backend API only, prints credentials, and writes `.local/dev-seed.json`.

## Commands Run

- Local dev seed workflow:
  - Added schema-only migration `000013_dev_seed_runs` for seed idempotency markers.
  - Added `scripts/dev_seed.py`, `scripts/Dockerfile.dev-seed`, compose `dev-seed`, `make dev-seed`, and `make dev` post-health seed execution.
  - Seed path uses backend API only: first-admin invite, invite accept, `/company/profile`, `/company/divisions`, `/company/units`; `/launch-wizard` is not used.
  - Seed output prints `http://localhost:3100`, versioned admin email `admin+2026-04-29-1@vrk.local`, password, organization id, 3 divisions, 9 units, and `.local/dev-seed.json`.
  - `.local/dev-seed.json` is gitignored, written with `0600`, and includes no session token.
  - `dev_seed_runs.result_json` stores marker metadata and IDs only; DB audit confirms it does not contain `password`.
  - Synced canonical docs:
    - `README.md`
    - `docs/onboarding.md`
    - `docs/architecture/platform-runtime-baseline.md`
  - Verification status: `PASS`.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-py-compile-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-compose-config-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-backend-build-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-make-clean-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-make-dev-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-rerun-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-make-smoke-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-login-proof-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-db-marker-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-file-mode-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-json-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-harness-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/local-dev-seed-diff-check-2026-04-29.txt`

- Division terminology correction after user clarification:
  - Realigned `proof_slice010_org_structure.py`, canonical docs, and stage artifacts to the implemented `/company/divisions`, `divisionId`, scope `division`, and role templates `division_head` / `division_operator`.
  - Kept Russian UI wording `подразделение/филиал` where it is user-facing copy, but removed stale API/contract references to `subdivision`.
  - Reopened `stage03-org-hierarchy-and-launch-wizard` and `stage03-slice010-company-org-structure-correction` in `feature_list.json` (`passes: false`) until a fresh verifier returns `PASS`.
  - `python3 -m py_compile .agent/stages/03-identity-master-data/proof_slice010_org_structure.py`
  - `VRK_API_BASE_URL=http://127.0.0.1:18180 VRK_WEB_BASE_URL=http://127.0.0.1:3110 VRK_STAGE03_SLICE010_SEED=20260429042 python3 .agent/stages/03-identity-master-data/proof_slice010_org_structure.py`
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
  - focused stale `subdivision` terminology audit over current docs/stage/proof artifacts
  - focused division contract audit over docs, proof, backend role/service code, web API types, and Swagger
  - `jq empty .agent/stages/03-identity-master-data/evidence.json .agent/stages/03-identity-master-data/feature_list.json .agent/stages/03-identity-master-data/verdict.json`
  - Status: `PASS` for compile, targeted proof on the division-aligned check stack, harness, stale-term audit, contract audit, and JSON validation.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-proof-py-compile-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-proof-run-check-stack-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-harness-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-terminology-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-contract-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-json-audit-2026-04-29.txt`

- Fresh verifier after division terminology correction:
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
  - `python3 -m py_compile .agent/stages/03-identity-master-data/proof_slice010_org_structure.py`
  - `VRK_API_BASE_URL=http://127.0.0.1:18180 VRK_WEB_BASE_URL=http://127.0.0.1:3110 VRK_STAGE03_SLICE010_SEED=20260429099 python3 .agent/stages/03-identity-master-data/proof_slice010_org_structure.py`
  - Storybook component lookup reruns and Web Interface Guidelines review
  - Status: `PASS`; no failed criteria and no proof gaps.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-current-fresh-verifier-harness-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-current-fresh-verifier-proof-run-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-current-fresh-verifier-summary-2026-04-29.json`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-current-fresh-verifier-contract-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-current-fresh-verifier-terminology-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-current-fresh-verifier-doc-sync-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-current-fresh-verifier-ui-review-2026-04-29.txt`
  - Parent orchestrator accepted this PASS and flipped the affected `feature_list.json` entries back to `passes: true`.
  - Post-flip JSON audit and harness remained `PASS`:
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-post-verifier-json-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-post-verifier-harness-2026-04-29.txt`

- Division + Role Model v1 final checkpoint:
  - Canonical role templates are `organization_admin`, `organization_head`, `division_head`, `division_operator`, `unit_head`, `unit_operator`, and `auditor`.
  - Scope compatibility is enforced: organization roles only on `organization`, division roles only on `division`, unit roles only on `unit`, and `auditor` on any of the three scopes.
  - Stage 03 v1 mutate capabilities remain only on active customer `organization_admin` at organization scope; all other roles are scope-aware read-only until later stages enable more capability-map entries.
  - Active terminology audit over `apps/backend/internal`, backend Swagger, `apps/web`, canonical docs, and `scripts` found no legacy public contract terms for the old subdivision/observer model.
  - Updated canonical docs and stage contract:
    - `docs/architecture/identity-master-data.md`
    - `docs/roadmap.md`
    - `docs/PRD-MVP.md`
    - `.agent/stages/03-identity-master-data/stage_spec.md`
    - `.agent/stages/03-identity-master-data/sprint_contract.md`
  - Verification status: `PASS`.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-active-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-make-smoke-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-backend-test-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-backend-build-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-sqlc-docker-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-swagger-docker-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-web-lint-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-web-typecheck-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-web-build-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-storybook-build-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-browser-smoke-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-division-role-model-harness-2026-04-29.txt`

- Newton doc-drift fixer:
  - Updated `docs/roadmap.md` and `docs/design/customer-admin-bootstrap-flow.md` so their legacy legal-form compatibility sentences include `LLC -> ООО`.
  - Updated `docs/design/diagrams/customer-admin-bootstrap-flow.drawio` so the visible legal-form examples are `ООО, АО, ПАО`.
  - `rg -n "LLC -> ООО" docs/roadmap.md docs/design/customer-admin-bootstrap-flow.md`
  - `rg -n "Организационно-правовая.*ООО, АО, ПАО" docs/design/diagrams/customer-admin-bootstrap-flow.drawio`
  - drawio stale option/alias absence audit for `АО, ЗАО, ООО, ИП`, `ОАО`, and `ЗАО`
  - `xmllint --noout docs/design/diagrams/customer-admin-bootstrap-flow.drawio`
  - `jq empty .agent/stages/03-identity-master-data/evidence.json`
  - Status: `PASS`
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-newton-doc-drift-fixer-2026-04-29.txt`

- Legal-type correction builder rerun:
  - Corrected the stale field contract so organization `Тип` / `propertyType` is legal form `ООО` / `АО` / `ПАО`, division/branch has no selectable type, and unit type remains `ВРД` / `ВРЗ` / `ВУ` / `ВРП`.
  - `python3 -m py_compile .agent/stages/03-identity-master-data/proof_slice010_org_structure.py`
  - `docker run --rm -v /Users/yura-posledov/cursor/vrk/apps/backend:/src -w /src sqlc/sqlc:1.30.0 generate -f sqlc.yaml`
  - `docker run --rm -v /Users/yura-posledov/cursor/vrk/apps/backend:/src -w /src -e GOCACHE=/tmp/go-cache -e GOMODCACHE=/tmp/go-mod-cache golang:1.26.1 go test ./...`
  - `docker run --rm -v /Users/yura-posledov/cursor/vrk/apps/backend:/src -w /src -e GOCACHE=/tmp/go-cache -e GOMODCACHE=/tmp/go-mod-cache golang:1.26.1 go build -buildvcs=false ./...`
  - `docker run --rm -v /Users/yura-posledov/cursor/vrk/apps/backend:/src -w /src -e GOCACHE=/tmp/go-cache -e GOMODCACHE=/tmp/go-mod-cache golang:1.26.1 sh -c 'go install github.com/swaggo/swag/cmd/swag@v1.16.6 && /go/bin/swag init -g cmd/api/main.go -o docs/swagger'`
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run typecheck`
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run lint`
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run build`
  - `VRK_STAGE03_SLICE010_SEED=1777434591 python3 .agent/stages/03-identity-master-data/proof_slice010_org_structure.py`
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
  - Status: `PASS` for compile, sqlc Docker fallback, backend test/build, Swagger refresh, web typecheck/lint/build, targeted proof, doc audit, UI review, and harness.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-proof-py-compile-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-sqlc-docker-generate-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-backend-go-test-docker-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-backend-go-build-docker-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-swagger-docker-rerun-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-web-typecheck-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-web-lint-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-web-build-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-proof-run-rerun2-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-summary-2026-04-29.json`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-primary-org-structure-proof-2026-04-29.json`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-web-web-accept-company-2026-04-29.json`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-doc-contract-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-ui-review-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-harness-pre-verifier-2026-04-29.txt`
- Post-Newton doc-only fixer:
  - Newton's fresh verifier reproduced the runtime/code proof but returned `FAIL` for documentation drift.
  - The doc-only fixer added explicit `LLC -> ООО` alongside `ОАО -> ПАО` and `ЗАО -> АО` in the roadmap and customer-admin bootstrap flow docs, and updated the Draw.io source to show visible legal-form options `ООО, АО, ПАО`.
  - Follow-up parent cleanup restored `division` terminology in `docs/roadmap.md` and kept all three alias mappings explicit.
  - Status: `READY_FOR_POST_FIXER_FRESH_VERIFIER`.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/slice-010-newton-doc-drift-fixer-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-parent-doc-cleanup-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-legal-type-harness-after-doc-fix-2026-04-29.txt`

- Harness self-check:
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
  - Status: `PASS`
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-harness-check-2026-04-29.txt`
- Doc-sync fixer checks:
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
  - Status: `PASS` on 2026-04-29T02:34:55Z
  - `rg -n "ВРД|ВРЗ|ВУ|ВРП|registeredAddress|address|leaderFullName|managerName|leaderPosition|contractPhone|contractEmail|actingBasis|active.*select|Archived|archive|alias|compatibility" docs/architecture/identity-master-data.md .agent/stages/03-identity-master-data/sprint_contract.md .agent/stages/03-identity-master-data/problems.md`
  - Status: `PASS`; canonical hits are now present in `docs/architecture/identity-master-data.md`.
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-fixer-doc-sync-2026-04-29.txt`
- Post-fixer fresh verifier:
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
  - `VRK_STAGE03_SLICE010_SEED=1777430591 python3 .agent/stages/03-identity-master-data/proof_slice010_org_structure.py`
  - Storybook component lookup reruns and Web Interface Guidelines review
  - Status: `PASS`
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/slice-010-post-fixer-verifier-harness-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-post-fixer-verifier-proof-run-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-post-fixer-verifier-summary-2026-04-29.json`
    - `.agent/stages/03-identity-master-data/raw/slice-010-post-fixer-verifier-doc-alias-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-post-fixer-verifier-ui-review-2026-04-29.txt`
- Requested repo-local sqlc:
  - `PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH /Users/yura-posledov/cursor/vrk/.agent/tmp-tools/sqlc generate -f apps/backend/sqlc.yaml`
  - Status: `BLOCKED`
  - Blocker: `.agent/tmp-tools/sqlc` does not exist in this checkout.
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-sqlc-repo-tool-missing-2026-04-29.txt`
- Requested repo-local Go:
  - `PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH go version`
  - Status: `BLOCKED`
  - Blocker: repo-local `go` is not available under `.agent/tmp-tools/go/bin`, and `go` is not on PATH.
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-go-repo-tool-missing-2026-04-29.txt`
- Docker sqlc fallback:
  - `docker run --rm -v /Users/yura-posledov/cursor/vrk/apps/backend:/src -w /src sqlc/sqlc:1.30.0 generate -f sqlc.yaml`
  - Status: `PASS`
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-sqlc-docker-generate-2026-04-29.txt`
- Backend formatting:
  - Docker `gofmt` over touched backend Go files
  - Status: `PASS`
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-backend-gofmt-docker-2026-04-29.txt`
- Backend tests:
  - Docker `go test ./...`
  - Status: `PASS`
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-backend-go-test-docker-2026-04-29.txt`
- Backend build:
  - Docker `go build -buildvcs=false ./...`
  - Status: `PASS`
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-backend-go-build-docker-2026-04-29.txt`
- Web typecheck:
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run typecheck`
  - Status: `PASS`
  - Current raw: `.agent/stages/03-identity-master-data/raw/slice-010-web-typecheck-rerun-2026-04-29.txt`
- Web lint:
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run lint`
  - Status: `PASS`
  - Current raw: `.agent/stages/03-identity-master-data/raw/slice-010-web-lint-rerun-2026-04-29.txt`
- Web build:
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run build`
  - Status: `PASS`
  - Current raw: `.agent/stages/03-identity-master-data/raw/slice-010-web-build-rerun-2026-04-29.txt`
- UI review gate:
  - Web Interface Guidelines source fetched from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
  - Status: `PASS` after local fixes
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-29.md`
    - `.agent/stages/03-identity-master-data/raw/slice-010-ui-review-2026-04-29.txt`
- Runtime stack:
  - `make dev`
  - Status: `PASS`
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-make-dev-2026-04-29.txt`
- Targeted slice proof:
  - `python3 -m py_compile .agent/stages/03-identity-master-data/proof_slice010_org_structure.py`
  - Status: `PASS`
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-proof-py-compile-2026-04-29.txt`
  - `python3 .agent/stages/03-identity-master-data/proof_slice010_org_structure.py`
  - Status: `PASS` on final rerun
  - Current raw:
    - `.agent/stages/03-identity-master-data/raw/slice-010-proof-run-rerun3-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-proof-run-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-summary-2026-04-29.json`
    - `.agent/stages/03-identity-master-data/raw/slice-010-primary-org-structure-proof-2026-04-29.json`
    - `.agent/stages/03-identity-master-data/raw/slice-010-empty-org-invite-proof-2026-04-29.json`
    - `.agent/stages/03-identity-master-data/raw/slice-010-web-web-accept-company-2026-04-29.json`
  - Historical failed proof-script reruns were harness defects, not accepted product proof:
    - `.agent/stages/03-identity-master-data/raw/slice-010-proof-run-command-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-proof-run-rerun-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-010-proof-run-rerun2-2026-04-29.txt`

## Builder Proof Coverage

- First-admin acceptance through the web path:
  - `POST /api/auth/invites/{token}/accept` sets `vrk_session`;
  - returned session has `requiresLaunchWizard: false`, `organization.launchState: active`, and `workspace.landingPath: /company`;
  - authenticated `/company` renders the persistent management surface;
  - `/company/setup` is non-canonical and redirects to `/company`.
- Persistent organization profile:
  - `PATCH /api/v1/company/profile` preserves organization legal form through `propertyType` and `type` compatibility alias plus `name`, `registeredAddress`, `leaderFullName`, `leaderPosition`, `contractPhone`, `contractEmail`, and `actingBasis`;
  - accepted visible legal forms are `ООО`, `АО`, `ПАО`;
  - legacy inputs normalize as `ОАО -> ПАО`, `ЗАО -> АО`, `LLC -> ООО`;
  - operational values such as `ВРД` are rejected for organization legal form.
- Canonical field contract:
  - `docs/architecture/identity-master-data.md` now records differentiated type semantics: organization `propertyType`/`type` alias is ОПФ `ООО`/`АО`/`ПАО`, division/branch has no selectable type and uses hidden storage default `division`, and unit `type` is `ВРД`/`ВРЗ`/`ВУ`/`ВРП`;
  - the same doc records `registeredAddress`/`address` and `leaderFullName`/`managerName` alias semantics, remaining business fields, preserved `code`/`region`/`status`/`comment`, and active-only archive/selection constraints for `/company`.
- Persistent division/unit management:
  - first division create works without a user-facing `type` payload;
  - division rows no longer show hidden storage type in the `/company` UI;
  - unit under division create works;
  - direct organization unit create works;
  - unit create rejects invalid legal-form values such as `ООО` and preserves valid operational values such as `ВУ`;
  - later division and unit create works through the same endpoints;
  - division and unit edit persist fields;
  - empty division/unit archive succeeds and archived nodes disappear from active session selectors/projections.
- Archive blockers and invite target validation:
  - division with active child unit returns `409 archive blocked by active references`;
  - unit with active scoped invite returns `409 archive blocked by active references`;
  - missing, hidden, or archived division/unit invite targets return `400 invite scope target is invalid`.
- Scoped read-only projections:
  - division-scoped accepted employee sees only target division and child units;
  - unit-scoped accepted employee sees only target unit and no broader division graph;
  - backend mutation attempts from division/unit sessions return `403 forbidden`;
  - scoped users have `workspace.canManageEmployeeInvites: false`.
- Employee invites:
  - organization-scope employee invite works immediately after first-admin acceptance in an organization with no divisions or units.

## UI Workflow Evidence

- Skill/workflow used: `$vrk-web-ui-workflow`.
- Design/source-of-truth context read:
  - `.impeccable.md`
  - `docs/design/ui-workflow.md`
  - `docs/design/serviceops-design-system.md`
  - `docs/architecture/frontend-architecture.md`
  - `docs/design/storybook-component-backlog.md`
- Storybook lookup raw:
  - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-010-org-structure-primary-2026-04-29.txt`
  - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-010-org-structure-primitives-2026-04-29.txt`
- Reuse decision: `reuse`
  - no complete org-structure reusable family existed;
  - implementation reused current primitives and feature-local composition: `Button`, `Card`, `InputField`, `SelectField`, `TextareaField`, `InlineAlert`, `Tabs`;
  - no new reusable UI family was introduced, so no net-new stories/backlog entry are required for the company workspace.
- Changed UI files reviewed:
  - `apps/web/app/(runtime)/company/page.tsx`
  - `apps/web/app/(runtime)/company/setup/page.tsx`
  - `apps/web/app/(runtime)/company/_components/CompanyStructureWorkspace.tsx`
  - `apps/web/features/Stage03Access/ui/EmployeeInviteManager.tsx`
  - `apps/web/features/Stage03Bootstrap/ui/FirstAdminActivationForm.tsx`
  - `apps/web/app/register/[token]/page.tsx`
  - `apps/web/shared/ui/InputField.tsx`
  - `apps/web/shared/ui/SelectField.tsx`
  - `apps/web/shared/ui/TextareaField.tsx`
  - `apps/web/shared/ui/Tabs.tsx`
  - `apps/web/shared/ui/InlineAlert.tsx`
- Review result: `PASS` after adding stable form names/autocomplete hints, decorative icon hiding, and confirmation before archive/revoke actions.

## Canonical Docs Synced

- `docs/roadmap.md`
- `docs/PRD-MVP.md`
- `docs/architecture/identity-master-data.md`
- `docs/design/customer-admin-bootstrap-flow.md`
- `docs/design/diagrams/customer-admin-bootstrap-flow.drawio`
- `docs/architecture/frontend-architecture.md`
- Swagger/OpenAPI:
  - `apps/backend/docs/swagger/docs.go`
  - `apps/backend/docs/swagger/swagger.json`
  - `apps/backend/docs/swagger/swagger.yaml`

Fixer doc-sync update: `docs/architecture/identity-master-data.md` section `1.2.1` now records the concrete `/company` business-field alias/type contract required by `sprint_contract.md`. No production code or generated OpenAPI was changed in the fixer pass.

Newton doc-drift fixer update: `docs/roadmap.md`, `docs/design/customer-admin-bootstrap-flow.md`, and `docs/design/diagrams/customer-admin-bootstrap-flow.drawio` now align with the `LLC -> ООО` compatibility mapping and the visible selector set `ООО`, `АО`, `ПАО`.

## Stage Artifact State

- `evidence.md`, `evidence.json`, and `progress.md` are updated by the builder for slice-010.
- Fixer refreshed `evidence.md`, `evidence.json`, `progress.md`, and `problems.md` after closing the canonical doc gap locally.
- Post-fixer fresh verifier updated `verdict.json` and `problems.md` to `PASS` / no open slice-010 proof gaps.
- Parent orchestrator updated `feature_list.json` after verifier `PASS` for:
  - `stage03-first-admin-activation`;
  - `stage03-org-hierarchy-and-launch-wizard`;
  - `stage03-slice010-company-org-structure-correction`.
- Newton doc-drift fixer refreshed `evidence.md`, `evidence.json`, `progress.md`, and raw note only. It did not edit `feature_list.json`, `verdict.json`, or `problems.md`.

## Incubator Seed Promotion Note

- During Incubator seed promotion on 2026-04-29, the public Yandex Serverless Container endpoint returned a cloud-front `403` for protected backend calls carrying `Authorization: Bearer ...`.
- Runtime fix:
  - backend protected handlers accept `X-VRK-Session-Token` in addition to `Authorization: Bearer`;
  - web server proxies and server-side backend clients use `X-VRK-Session-Token`;
  - `scripts/dev_seed.py` uses `X-VRK-Session-Token` for session-authenticated API calls.
- Canonical docs synced:
  - `docs/architecture/platform-runtime-baseline.md`;
  - `docs/architecture/yandex-cloud-incubator-deployment.md`.

## Remaining Verifier Requirements

- Newton reported documentation drift only on the legal-type correction. The three reported canonical doc/diagram gaps are fixed and ready for a new fresh verifier to own `verdict.json` / `problems.md`.
- Residual environment note: repo-local `.agent/tmp-tools/sqlc` and `.agent/tmp-tools/go/bin/go` are absent in this checkout; Docker fallbacks were used and passed before the doc-only fixer, and the post-fixer verifier confirmed production code did not change afterward.
