# Evidence

- Stage ID: 03-identity-master-data
- Sprint Contract ID: slice-005-metrology-journals-archiving-and-proof

## Commands run

- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
- `git log --oneline --decorate -8`
- `make dev`
- `docker compose -f compose.platform.yml ps`
- `make smoke`
- `./scripts/backend_go_test.sh`
- `./scripts/backend_go_build.sh`
- `docker run --rm -v /Users/yura-posledov/cursor/vrk:/workspace -w /workspace/apps/backend golang:1.26-alpine sh -lc 'apk add --no-cache git ca-certificates >/dev/null && /usr/local/go/bin/go install github.com/swaggo/swag/cmd/swag@v1.16.6 && /go/bin/swag init -g cmd/api/main.go -o docs/swagger'`
- `python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "metrology journal archive archive status derivation measuring instrument journal standard journal validity due date archive registry history timeline attachments dictionary local draft archive restore" --limit 12`
- `env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run typecheck`
- `env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run lint`
- `env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run build`
- `env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run browser-smoke`
- `python3 .agent/stages/03-identity-master-data/proof_slice005_metrology_archive.py`

## Tests run

- Harness validation:
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-harness-check-2026-04-19.txt`
- Root platform floor:
  - `make dev`
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-make-dev-2026-04-19.txt`
  - compose snapshot: `.agent/stages/03-identity-master-data/raw/slice-005-compose-ps-2026-04-19.txt`
- Root smoke:
  - `make smoke`
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-make-smoke-2026-04-19.txt`
- Backend compile/test proof:
  - `./scripts/backend_go_test.sh`
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-backend-go-test-2026-04-19.txt`
  - `./scripts/backend_go_build.sh`
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-backend-go-build-2026-04-19.txt`
  - Swagger refresh
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-swagger-refresh-2026-04-19.txt`
- Web proof:
  - local `apps/web` typecheck
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-web-typecheck-2026-04-19.txt`
  - local `apps/web` lint
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-web-lint-2026-04-19.txt`
  - local `apps/web` production build
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-web-build-2026-04-19.txt`
  - browser smoke
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-web-browser-smoke-2026-04-19.txt`
- Direct backend slice-005 proof:
  - result: `PASS`
  - run raw: `.agent/stages/03-identity-master-data/raw/slice-005-direct-proof-run-2026-04-19.txt`
  - summary: `.agent/stages/03-identity-master-data/raw/slice-005-direct-proof-summary-2026-04-19.json`
  - log: `.agent/stages/03-identity-master-data/raw/slice-005-direct-proof-2026-04-19.log`
  - key raw walkthroughs:
    - admin equipment list: `.agent/stages/03-identity-master-data/raw/slice-005-direct-admin-equipment-list-2026-04-19.json`
    - admin equipment list with archive visibility: `.agent/stages/03-identity-master-data/raw/slice-005-direct-admin-equipment-list-include-archived-2026-04-19.json`
    - admin measuring instruments list: `.agent/stages/03-identity-master-data/raw/slice-005-direct-admin-measuring-instruments-list-2026-04-19.json`
    - admin measuring instruments list with archive visibility: `.agent/stages/03-identity-master-data/raw/slice-005-direct-admin-measuring-instruments-list-include-archived-2026-04-19.json`
    - admin standards list: `.agent/stages/03-identity-master-data/raw/slice-005-direct-admin-standards-list-2026-04-19.json`
    - admin standards list with archive visibility: `.agent/stages/03-identity-master-data/raw/slice-005-direct-admin-standards-list-include-archived-2026-04-19.json`
    - MI latest-valid derivation: `.agent/stages/03-identity-master-data/raw/slice-005-direct-mi-primary-journal-old-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-mi-primary-journal-latest-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-mi-primary-state-2026-04-19.json`
    - standard latest-valid derivation: `.agent/stages/03-identity-master-data/raw/slice-005-direct-standard-unit-one-journal-old-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-standard-unit-one-journal-latest-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-standard-unit-one-state-2026-04-19.json`
    - archive persistence proof: `.agent/stages/03-identity-master-data/raw/slice-005-direct-equipment-archive-result-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-mi-archive-result-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-standard-archive-result-2026-04-19.json`
    - archived-row visibility proof: `.agent/stages/03-identity-master-data/raw/slice-005-direct-archived-row-equipment-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-archived-row-mi-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-archived-row-standard-2026-04-19.json`
    - archived mutation rejection: `.agent/stages/03-identity-master-data/raw/slice-005-direct-mi-archive-mutation-error-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-standard-archive-mutation-error-2026-04-19.json`
    - subdivision scope proof: `.agent/stages/03-identity-master-data/raw/slice-005-direct-subdivision-equipment-list-include-archived-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-subdivision-measuring-instruments-list-include-archived-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-subdivision-standards-list-include-archived-2026-04-19.json`
    - unit scope proof: `.agent/stages/03-identity-master-data/raw/slice-005-direct-unit-equipment-list-include-archived-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-unit-measuring-instruments-list-include-archived-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-unit-standards-list-include-archived-2026-04-19.json`
    - forbidden broader access: `.agent/stages/03-identity-master-data/raw/slice-005-direct-unit-forbidden-equipment-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-unit-forbidden-mi-journals-2026-04-19.json`, `.agent/stages/03-identity-master-data/raw/slice-005-direct-unit-forbidden-standard-journals-2026-04-19.json`
    - `/agreements` no-regression baseline: `.agent/stages/03-identity-master-data/raw/slice-005-direct-admin-agreements-list-2026-04-19.json`

## UI / API flows exercised

- UI route walkthrough:
  1. Customer admin logs in through the proven Stage 03 auth path and lands on `/company`.
  2. Customer admin opens `/equipment` and stays on one canonical public contour instead of switching to a parallel journals/archive route family.
  3. Customer admin switches between `/equipment`, `/equipment?tab=mi`, and `/equipment?tab=standards`, then appends journal entries for measuring instruments and standards through the same workspace.
  4. Customer admin toggles archive visibility to `?archived=1`, archives equipment / measuring instrument / standard records, and sees them disappear from default active view while remaining visible in explicit archive mode.
  5. Active relation pickers stay truthful while archive visibility is enabled:
    - equipment picker for built-in MI keeps using only active equipment records;
    - standard picker keeps using only active standards.
  6. Unit-scope employee logs in through the same Stage 03 auth path, opens `/equipment`, and sees only read-only in-scope journal/archive state without broader organization leakage or mutate controls.
- Direct backend proof:
  - first-admin bootstrap, launch wizard, and employee invite acceptance reuse the already-proven Stage 03 identity/access floor to create one fresh customer org plus subdivision/unit-scoped employees;
  - `POST /api/v1/equipment`, `POST /api/v1/measuring-instruments`, and `POST /api/v1/standards` prove the separate-registry baseline still holds with:
    - one equipment record without MI links;
    - one equipment record with linked MI;
    - one standalone MI;
    - one reusable standard linked across multiple MI contexts;
  - `POST /api/v1/measuring-instruments/{id}/journals` creates monotonic journal history for one active MI and one archived MI candidate;
  - `POST /api/v1/standards/{id}/journals` creates monotonic journal history for one active standard and one archived standard candidate;
  - `GET /api/v1/measuring-instruments`, `GET /api/v1/standards`, and subject journal endpoints prove:
    - latest journal row controls the derived current status;
    - latest `validUntil` controls `nextDueDate` when present;
    - archived state remains separate from derived metrology status;
  - `POST /api/v1/equipment/{id}/archive`, `POST /api/v1/measuring-instruments/{id}/archive`, and `POST /api/v1/standards/{id}/archive` prove archive-only lifecycle without hard delete;
  - archived journal mutation attempts are rejected for MI and standards;
  - scoped list/journal access remains correct for organization / subdivision / unit contours;
  - `GET /api/v1/agreements` stays reachable for the authenticated customer org, proving the `/contracts` baseline from slice-003 did not regress.

## Proof summary

- Slices `001`, `002`, `003`, and `004` remain in the current floor proof:
  - `pnpm run browser-smoke` re-proved first-admin bootstrap, employee invite acceptance + scoped restore, live `/contracts`, and live `/equipment` on the current repo state;
  - direct slice-005 proof confirmed the legacy `/agreements` adapter baseline still responds for the same authenticated customer org.
- Journal-driven metrology truth is real on the current repo state:
  - measuring instrument derived status follows the latest applicable journal row, not the older row;
  - measuring instrument `nextDueDate` comes from the latest journal `validUntil`;
  - archived measuring instrument proof shows `suspension` wins the derived status and leaves the record archived rather than deleted;
  - standard derived status follows the latest applicable journal row, with `decommission` producing `retired`;
  - archived standard proof keeps derived due/date history while leaving the record archived and persisted.
- Archive-only lifecycle is real:
  - equipment / MI / standards disappear from default active lists after archive;
  - the same records reappear only when archive visibility is explicitly requested;
  - archived rows remain in persistence and are not disguised hard deletes;
  - archived MI / standards reject new journal mutations.
- Separate registries and relation baseline remain real:
  - admin active counts in direct proof are `3` equipment records, `2` measuring instruments, and `4` standards before archive visibility;
  - at least one equipment item exists with zero MI links;
  - at least one equipment item has linked MI records;
  - one standalone MI exists with zero standards;
  - the shared standard remains reusable across more than one MI context.
- Scoped visibility boundaries remain real for journal/archive surfaces:
  - subdivision scope sees both child units below its subdivision, including allowed archived rows and journal history;
  - unit scope sees only its own active/archived records and its own journal rows;
  - broader unrelated equipment and journal access is rejected for the unit-scope user.
- Bounded dictionary decision is documented and truthful:
  - slice-005 did not introduce a standalone org-scoped dictionary/local-draft CRUD surface;
  - the proven scope is bounded to ownership labels for standards plus fixed metrology operation types required for journal/archive truth.

## UI workflow evidence

- Read:
  - `.impeccable.md`
  - `docs/design/ui-workflow.md`
  - `docs/design/serviceops-design-system.md`
  - `docs/design/storybook-component-backlog.md`
  - `docs/architecture/frontend-architecture.md`
- UI brief source:
  - stage artifact: `.agent/stages/03-identity-master-data/sprint_contract.md`
  - current slice objective: keep `/equipment` as one canonical contour while adding journal-driven metrology truth, archive-only lifecycle, and scope-filtered journal/archive visibility without parallel public routes.
- Storybook lookup:
  - query: `metrology journal archive archive status derivation measuring instrument journal standard journal validity due date archive registry history timeline attachments dictionary local draft archive restore`
  - raw: `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-005-2026-04-19-orchestrator.txt`
  - decision: `reuse`
  - rationale: the lookup surfaced generic badge/icon inventory only, so the implementation reused existing shared primitives and extended feature-local `EquipmentRegistryWorkspace` instead of creating a new reusable journal/archive family.
  - stories/backlog update note: no net-new reusable family was introduced, so no Storybook story or backlog update was required for this slice.
- Changed UI files:
  - `apps/web/app/(runtime)/equipment/page.tsx`
  - `apps/web/features/Stage03Equipment/ui/EquipmentRegistryWorkspace.tsx`
  - `apps/web/tests/equipment-registries.smoke.spec.ts`
- UI review:
  - gate: `$web-design-guidelines`
  - source: `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-19.md`
  - result: `PASS`
  - raw: `.agent/stages/03-identity-master-data/raw/slice-005-ui-review-2026-04-19.txt`
  - scope:
    - `apps/web/app/(runtime)/equipment/page.tsx`
    - `apps/web/features/Stage03Equipment/ui/EquipmentRegistryWorkspace.tsx`
  - findings closed in code:
    - every archive action in `EquipmentRegistryWorkspace` now asks for explicit confirmation before mutating archive state, including equipment list cards and MI / standard detail-panel archive buttons;
    - archive visibility is URL-backed through `?archived=1` instead of being trapped in local-only toggle state;
    - custom registry tab buttons expose visible keyboard focus rings;
    - identifier/detail cells continue to use `translate="no"` where the value is a real identifier.

## Artifacts collected

- Updated canonical docs:
  - `docs/roadmap.md`
  - `docs/PRD-MVP.md`
  - `docs/architecture/identity-master-data.md`
  - `docs/architecture/frontend-architecture.md`
  - `docs/design/customer-admin-bootstrap-flow.md`
- Updated stage artifacts:
  - `.agent/stages/03-identity-master-data/stage_spec.md`
  - `.agent/stages/03-identity-master-data/evidence.md`
  - `.agent/stages/03-identity-master-data/evidence.json`
  - `.agent/stages/03-identity-master-data/verdict.json`
  - `.agent/stages/03-identity-master-data/progress.md`
  - `.agent/stages/03-identity-master-data/feature_list.json`
- Raw outputs:
  - `.agent/stages/03-identity-master-data/raw/slice-005-git-log-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-harness-check-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-make-dev-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-compose-ps-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-make-smoke-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-backend-go-test-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-backend-go-build-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-swagger-refresh-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-web-typecheck-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-web-lint-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-web-build-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-web-browser-smoke-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-direct-proof-run-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-direct-proof-summary-2026-04-19.json`
  - `.agent/stages/03-identity-master-data/raw/slice-005-direct-proof-2026-04-19.log`
  - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-005-2026-04-19-orchestrator.txt`
  - `.agent/stages/03-identity-master-data/raw/slice-005-ui-review-2026-04-19.txt`
  - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-19.md`

## Notes / limitations

- Clean slice-005 floor artifacts were regenerated after the final `/equipment` UI review fixes so the saved `make dev` / smoke logs match the current repo state.
- Reproducible web proof stays scoped to local `apps/web` `pnpm run` commands under the bundled Node runtime, which keeps slice-005 verification independent from unrelated workspace-level package state.
- The brand-new fresh verifier recorded `PASS` for slice-005 in `.agent/stages/03-identity-master-data/verdict.json`.
- `feature_list.json` now marks both slice-005 features proven with current evidence refs.
- Stage 03 is fully proven and ready for closure/handoff; no automatic Stage 04 work was started in this run.
