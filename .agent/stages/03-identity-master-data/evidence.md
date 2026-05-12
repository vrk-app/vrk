# Evidence

- Stage ID: `03-identity-master-data`
- Current correction slice: `technical-equipment-operation-journal`
- Previous continuation slice: `slice-011-input-help-tooltip`
- Previous bounded UI correction slice: `slice-013-access-confirmation-dialogs`
- Builder state: `COMPLETE`
- Verifier state: `AWAITING_FRESH_VERIFIER`

This bundle records builder-collected proof, the minimal fixer doc-sync, and the historical post-fixer fresh verifier `PASS` for the 2026-04-29 Stage 03 correction that moves the product target from the historical launch wizard to persistent `/company` organization profile and structure management.

Newton later failed the legal-type correction only for documentation drift, and that doc-only gap was fixed. The latest user clarification confirms `division` is the intended API/domain term replacing `subdivision`; a fresh verifier reproduced the division-aligned proof and returned `PASS`. The follow-up Role Model v1 checkpoint verified the canonical role catalog, scope compatibility, v1 capability behavior, active terminology hard cutover, and full backend/web smoke gates.

The 2026-04-29 local-dev seed slice adds an operational developer workflow on top of the proven Stage 03 identity/org-structure APIs: `make dev` now runs a one-shot `dev-seed` service after compose health, creates a demo customer organization through backend API only, prints credentials, and writes `.local/dev-seed.json`.

The 2026-04-29 company profile/access continuation completes the expanded profile, scoped admin, logo storage, password policy, and contract-scope hardening proof. It adds the missing contract update visibility guard, aligns the contracts UI to workspace-visible scopes for `division_admin` / `unit_admin`, refreshes Storybook scoped-admin coverage, updates active stage legal-form evidence to `ООО` / `ПАО` / `НАО` / `ИП`, and confirms the measuring-instrument UI label is `ФИФ`.

The 2026-04-30 equipment archive action parity slice is a bounded UI-only correction for `/equipment`. It keeps the existing `ConfirmDialog` confirmation and archive APIs, but aligns equipment, measuring-instrument, and standard archive trigger buttons to the compact division/unit pattern: `Archive` icon, visible `Архивировать`, `size="sm"`, and `variant="ghost"`. Canonical docs were not changed because no product behavior, API contract, schema, or workflow decision changed.

The 2026-04-30 equipment registry declutter slice is a bounded UI-only correction for the logged-in customer `/equipment` page. It replaces the large PageHeader card with a compact `h1` + capability badge row, removes duplicated onboarding/manageability copy and the access-area summary card, keeps the three registry KPI cards, and moves archive visibility into the tab row as a compact `Button` with `aria-pressed`. Canonical docs were not changed because the documented `/equipment` route, query-backed tabs, archive query contract, APIs, and product behavior did not change.

The 2026-04-30 access confirmation dialogs slice is a bounded UI-only correction for destructive access actions. It reuses the shared story-backed `ConfirmDialog` used by equipment archiving for employee deactivation and invite revocation, removes native `window.confirm` from the access flows and the remaining company structure archive action, and removes the obsolete Storybook runtime confirmation shim. Canonical docs were not changed because backend routes, API contracts, persistence, access lifecycle rules, and product semantics did not change.

The 2026-04-30 input help tooltip slice extends the existing shared `InputField` instead of creating a new input family. Non-error `hint` text now appears through a compact help trigger near the label and opens on hover/focus; the hint no longer occupies a persistent helper row under the field. Field errors remain visible below the input and keep `aria-describedby` priority.

The 2026-05-11 equipment domain correction replaces the historical tabbed `/equipment` target with one customer equipment workspace. The page keeps the public `/equipment` route, removes the visible `Оборудование / СИ / Эталоны` tab model, provides one `Новое оборудование` form with `Техническое` / `Диагностическое` type selection, treats diagnostic equipment as the owner of `0..N` standards/setup measures, shows those standards only inside diagnostic equipment cards, removes the target standard journal route, and keeps one equipment operation journal. Canonical product and technical docs were synced because this changes the product/API/persistence contract.

Fresh verifier initially failed this slice for owned-standard migration/read-path gaps, remaining standalone standards registry exposure, stale current-slice UI evidence metadata, and two placeholder findings. The minimal fixer plus parent follow-up closed those gaps: migration 16 now makes current standards diagnostic-owned or archived, diagnostic cards ignore the old many-to-many table, standalone standards routes/proxies are removed, placeholders pass the UI gate, and current-slice metadata points to slice-014. The second fresh verifier reproduced the product/API/persistence/UI proof and failed only for a stale `stage_spec.md` verification-plan bullet. The doc-only drift was fixed, and the final fresh verifier returned `PASS`.

The 2026-05-11 owned-standards edit-modal follow-up extends the same unified `/equipment` contract: customer admins can now add new owned standards/setup measures and mark existing owned standards for physical deletion while editing diagnostic equipment. Both operations are queued in the modal and sent only after `Сохранить изменения`. The backend adds `DELETE /api/v1/measuring-instruments/{id}/standards/{standardId}` and the matching Next proxy; the service verifies manager access, customer scope, visible diagnostic parent, non-archived parent, and standard ownership before hard-deleting standard journal rows and the standard row. Canonical docs and stage artifacts are synced because this is an explicit hard-delete exception for diagnostic-owned standards, not archive visibility for equipment.

The 2026-05-12 brand-logo decision applies generated PNG option 2, `Технический реестр`, to the current `apps/web` company/equipment workspace and generated PNG option 5, `Полевой синк`, to the `apps/field` mobile/PWA contour. Canonical docs and Stage 06 harness artifacts now record this split so future field work inherits the mobile logo choice instead of reselecting it.

The 2026-05-12 equipment photos/gallery slice adds optional private media to the unified `/equipment` contract. Technical and diagnostic equipment now expose `photos`, store metadata in `registry_equipment_photos`, stream private objects through authenticated backend and Next proxy routes, and render a feature-local `EquipmentPhotoGallery` in the passport card media column with fallback illustrations for records without usable photos. Create/edit dialogs can stage local previews, mark existing photos for deletion, restore them before save, and apply upload/delete operations only after the JSON card save succeeds. Canonical product/API docs and Storybook equipment states were synced. Runtime smoke was not claimed because the existing compose backend on `127.0.0.1:18080` returned `404` for the new photo route and the runtime policy forbids replacing/restarting the long-running stack without an explicit request.

The 2026-05-12 technical equipment journal correction closes the remaining `/equipment` journal parity gap. Technical equipment now has `GET/POST /api/v1/equipment/{id}/journals`, journal rows persist in legacy `registry_metrology_journal_entries` with `subject_type = technical_equipment`, and equipment list/get responses expose `journalCount`, `latestJournal`, and `nextDueDate` derived from the latest applicable journal entry. Diagnostic equipment / `СИ` keeps the existing `measuring_instrument` journal subject for compatibility. The web journal selector now uses typed targets (`technical:<id>` / `diagnostic:<id>`), includes both technical and diagnostic equipment, excludes standards, and dispatches to the correct endpoint. Archived technical/diagnostic records preserve read-only history and reject new journal entries; read-only sessions see history without mutation controls. Canonical product, architecture, frontend, roadmap, and stage-plan docs were synced because this changes product/API behavior.

Fresh verifier returned `PASS` for `technical-equipment-operation-journal` at `2026-05-12T09:32:18Z`; failed criteria none, proof gaps none. The parent orchestrator marked `stage03-technical-equipment-operation-journal-parity` passed after that verifier result.

## Commands Run

- Technical equipment operation journal:
  - Used `$vrk-web-ui-workflow`; Storybook lookup for `technical-equipment-operation-journal` had already matched `Equipment/EquipmentRegistryWorkspace`, reuse decision `extend`, no new reusable component family introduced.
  - Backend/API:
    - added migration `000018_technical_equipment_journal_subject`;
    - added `metrologyjournal.SubjectTypeTechnicalEquipment`;
    - added technical equipment journal service/handler/routes and Swagger annotations;
    - added technical journal response summary fields to `EquipmentResponse`;
    - refreshed generated Swagger/OpenAPI.
  - Web:
    - added Next proxy route `/api/equipment/[equipmentId]/journals`;
    - extended `EquipmentRegistryWorkspace` journal state with typed technical/diagnostic targets;
    - updated API types, Storybook runtime mock/fixtures/stories, and targeted smoke coverage.
  - Synced canonical docs:
    - `docs/PRD-MVP.md`
    - `docs/architecture/identity-master-data.md`
    - `docs/architecture/frontend-architecture.md`
    - `docs/roadmap.md`
    - `.agent/stages/03-identity-master-data/equipment-domain-correction-plan.md`
  - Proof:
    - backend targeted equipment/measuringinstrument tests: PASS;
    - backend `go test ./...`: PASS;
    - backend `go build -buildvcs=false ./...`: PASS;
    - Swagger refresh: PASS;
    - web typecheck: PASS;
    - web lint: PASS with existing equipment photo `<img>` warnings only;
    - web build: PASS;
    - Storybook build: PASS with existing chunk-size warnings only;
    - existing compose-backed runtime migrated/rebuilt for backend/web, route probe changed from stale `404` to route-level `401` without token;
    - targeted `/equipment` Playwright smoke: PASS against `localhost:3100` / backend `:18080`;
    - source audits: selector no longer measuring-instrument-only, standard journal proxy routes absent, docs no longer claim diagnostic-only derivation;
    - Web Interface Guidelines review: PASS;
    - `git diff --check`: PASS.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-technical-equipment-operation-journal-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-technical-equipment-operation-journal-2026-05-12.md`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-ui-review-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-backend-targeted-test-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-backend-go-test-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-backend-go-build-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-swagger-refresh-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-web-lint-final-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-web-typecheck-final-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-web-build-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-storybook-build-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-compose-migrate-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-compose-rebuild-backend-web-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-runtime-route-probe-after-rebuild-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-equipment-smoke-rerun4-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-selector-source-audit-final-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-standard-journal-route-audit-final-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-doc-stale-audit-final-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/technical-equipment-operation-journal-diff-check-final-2026-05-12.txt`

- Brand-logo decision:
  - used `$imagegen` output from `apps/web/public/brand/logo-concepts`;
  - ran Storybook lookup for `sidebar brand logo auth brand mark app icon`; reuse decision: `extend`, matched `Layout/SidebarNav`;
  - applied web option 2 to `apps/web` metadata, manifest, favicon/special icons, auth surface, and runtime sidebar;
  - applied mobile option 5 to `apps/field` metadata, manifest, special icons, and field scaffold header;
  - synced canonical docs:
    - `docs/design/serviceops-design-system.md`
    - `docs/architecture/frontend-architecture.md`
    - `docs/architecture/platform-runtime-baseline.md`
    - `.agent/stages/06-field-engineer-offline/stage_spec.md`
    - `.agent/stages/06-field-engineer-offline/sprint_contract.md`
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-brand-logo-selection-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-brand-logo-selection-2026-05-12.md`
    - `.agent/stages/03-identity-master-data/raw/brand-logo-selection-ui-review-2026-05-12.txt`

- Equipment photos/gallery:
  - Used `$vrk-web-ui-workflow`; Storybook lookup for `equipment photo gallery product media thumbnails` matched existing `Equipment/EquipmentRegistryWorkspace`, reuse decision `extend`, no shared reusable family introduced.
  - Backend:
    - added migration `000017_equipment_photos`;
    - added private photo repository/service/handler package;
    - added upload/stream/delete routes for `/api/v1/equipment/{id}/photos` and `/api/v1/measuring-instruments/{id}/photos`;
    - extended equipment and diagnostic equipment responses with `photos`;
    - refreshed Swagger/OpenAPI.
  - Web:
    - added Next photo proxy routes under `/api/equipment/.../photos`;
    - extended registry API types and Storybook runtime mock/fixtures;
    - added feature-local `EquipmentPhotoGallery`;
    - added create/edit photo drafts with preview, pending delete, restore, and post-save mutation ordering;
    - updated `EquipmentPassportCard` media layout and equipment stories for single-photo, gallery, fallback, and pending edit states.
  - Synced canonical docs:
    - `docs/architecture/identity-master-data.md`
    - `docs/PRD-MVP.md`
    - `docs/design/storybook-component-backlog.md`
  - Proof:
    - backend `go test ./...`: PASS;
    - backend `go build -buildvcs=false ./...`: PASS;
    - Swagger refresh: PASS;
    - web lint: PASS with only the four expected private-stream/blob preview `<img>` warnings;
    - web typecheck: PASS;
    - web production build: PASS;
    - Storybook build: PASS with existing chunk-size warnings only;
    - Web Interface Guidelines review: PASS;
    - `git diff --check`: PASS.
  - Smoke/runtime note:
    - targeted smoke file was updated, but not run against compose because `POST /api/v1/equipment/00000000-0000-0000-0000-000000000000/photos` returned HTTP `404` on the existing backend process.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-equipment-photos-gallery-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-equipment-photos-2026-05-12.md`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-ui-review-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-backend-go-test-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-backend-go-build-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-swagger-refresh-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-web-lint-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-web-typecheck-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-web-build-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-storybook-build-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-diff-check-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-smoke-not-run-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-json-audit-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-harness-2026-05-12.txt`
    - `.agent/stages/03-identity-master-data/raw/equipment-photos-diff-check-post-evidence-2026-05-12.txt`

- Equipment domain correction:
  - Used `$vrk-web-ui-workflow`, read `.impeccable.md`, `docs/design/ui-workflow.md`, `docs/design/serviceops-design-system.md`, `docs/architecture/frontend-architecture.md`, `docs/architecture/documentation-workflow.md`, `docs/roadmap.md`, `docs/PRD-MVP.md`, `docs/architecture/identity-master-data.md`, and the active Stage 03 artifacts before implementation.
  - Ran Storybook lookup for `equipment registry diagnostic equipment standards journal`; reuse decision: `extend`, matched existing `Equipment/EquipmentRegistryWorkspace`.
  - Changed `/equipment` so old `tab=mi|standards` query params redirect to the unified route while preserving `archived=1`.
  - Extended `EquipmentRegistryWorkspace` instead of adding a parallel page or reusable family:
    - one surface `Оборудование в учете`;
    - one form `Новое оборудование`;
    - `Тип оборудования: Техническое | Диагностическое`;
    - diagnostic-only fields and dynamic `0..N` standards/setup measures;
    - standards shown only inside diagnostic equipment cards;
    - one `Журнал операций по оборудованию`.
  - Updated `apps/web/shared/api/equipment.ts`, Storybook runtime fixtures, `EquipmentRegistryWorkspace` stories, and targeted `/equipment` smoke tests for the unified model.
  - Added migration `000016_equipment_domain_correction` and backend service/repository validation so standards are owned by one diagnostic equipment record, archived parents reject new standard/journal mutations, and the removed standard journal route is no longer exposed in target API/Swagger.
  - Synced canonical docs:
    - `docs/PRD-MVP.md`
    - `docs/roadmap.md`
    - `docs/architecture/identity-master-data.md`
    - `docs/architecture/frontend-architecture.md`
    - `.agent/stages/03-identity-master-data/stage_spec.md`
    - `.agent/stages/03-identity-master-data/sprint_contract.md`
    - `.agent/stages/03-identity-master-data/equipment-domain-correction-plan.md`
  - Verification status before fresh verifier: `SELF_VERIFIED_AWAITING_FRESH_VERIFIER`; backend tests/build, migration, Swagger refresh, web lint/typecheck/build, Storybook build, targeted smoke, source audits, UI review, and `git diff --check` passed.
  - Fresh verifier result: `FAIL`; see `.agent/stages/03-identity-master-data/problems.md` and `.agent/stages/03-identity-master-data/verdict.json`.
  - Fixer/parent follow-up:
    - updated migration/read paths so current standards are diagnostic-owned and old many-to-many links no longer feed cards;
    - removed standalone standards API/proxy/Swagger surfaces from the current target;
    - added nested owned-standard creation under diagnostic equipment;
    - fixed placeholder copy and Storybook fixture ownership;
    - refreshed current-slice evidence metadata.
  - Post-fix proof:
    - backend tests/build passed;
    - web lint/typecheck/build and Storybook build passed;
    - migration 16 reapplied cleanly and DB audit reports `active_without_parent=0`, `reusable_standard_rows=0`;
    - rebuilt backend `/readyz` passed;
    - targeted `/equipment` smoke rerun passed;
    - precise source audits passed.
  - Second fresh verifier result: product/API/persistence/UI proof passed; `FAIL` only for stale `stage_spec.md` verification-plan wording.
  - Doc-only follow-up: `.agent/stages/03-identity-master-data/stage_spec.md` now requires unified `/equipment` workspace proof instead of separate equipment / measuring-instrument / standards registries.
  - Final fresh verifier: `PASS`; failed criteria none, proof gaps none.
  - Owned-standards edit-modal follow-up:
    - added nested hard-delete backend/API/proxy support for diagnostic-owned standards;
    - replaced the old edit-modal non-editable standard note with a compact `Комплект эталонов` editor;
    - existing standards can be marked for deletion/restored before save;
    - new standards use the same required fields as diagnostic create and block save while incomplete;
    - modal save PATCHes diagnostic equipment, POSTs new standards, DELETEs removed standards, reloads registries, and selects the edited diagnostic record;
    - Storybook, runtime mocks, targeted smoke coverage, Swagger/OpenAPI, canonical docs, and stage artifacts were updated.
  - Owned-standards edit-modal raw:
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-014-owned-standards-edit-modal-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-05-11-slice-014-owned-standards-edit-modal.md`
    - `.agent/stages/03-identity-master-data/raw/slice-014-owned-standards-edit-modal-ui-review-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-owned-standards-edit-modal-json-audit-post-metadata-fix-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-owned-standards-edit-modal-harness-post-metadata-fix-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-owned-standards-edit-modal-diff-check-post-metadata-fix-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-owned-standards-followup-bounded-verifier-verdict.json`
    - `.agent/stages/03-identity-master-data/verdict.json`
    - `.agent/stages/03-identity-master-data/problems.md`
  - Owned-standards edit-modal fresh verifier: final bounded readback `PASS`; failed criteria none, proof gaps none.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-014-equipment-domain-correction-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-equipment-domain-correction-ui-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-backend-test-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-backend-build-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-web-lint-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-web-typecheck-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-web-build-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-storybook-build-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-equipment-smoke-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-web-source-audit-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-standard-journal-route-audit-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-compose-migration-status-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-ui-review-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-equipment-domain-correction-diff-check-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-fresh-verifier-*.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-fixer-*.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-migration-status-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-backend-test-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-backend-build-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-web-lint-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-web-typecheck-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-web-build-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-storybook-build-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-equipment-smoke-rerun-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-standards-surface-audit-precise-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-obsolete-ui-audit-precise-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-parent-owned-standard-db-audit-2026-05-11.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-second-verifier-*.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-014-final-verifier-*.txt`

- Input help tooltip:
  - Used `$vrk-web-ui-workflow` and read `.impeccable.md`, `docs/design/ui-workflow.md`, `docs/design/serviceops-design-system.md`, `docs/architecture/frontend-architecture.md`, `docs/design/storybook-component-backlog.md`, and the active Stage 03 `sprint_contract.md`.
  - Ran Storybook lookup for `InputField hint helper help tooltip`.
  - Reuse decision: `extend`; matched existing `Primitives/InputField` source and stories.
  - Changed `apps/web/shared/ui/InputField.tsx` so `hint` renders through a `CircleHelp` trigger with hover/focus tooltip and stable screen-reader description.
  - Preserved visible below-field error rendering and input `aria-describedby` priority for errors.
  - Updated `apps/web/stories/primitives/InputField.stories.tsx` with focus proof for `WithHint` and a `WithHintAndError` story.
  - Synced `docs/design/storybook-component-backlog.md` for the new `hint` contract and story coverage.
  - Web Interface Guidelines review: `PASS`.
  - Storybook DOM proof: `PASS`; `persistentHintRows=0`, `tooltipAfterHover=true`, and `tooltipAfterFocus=true`.
  - Runtime note: existing `localhost:3100` rendered a stale web bundle, so `/company` runtime proof was not claimed and no ad-hoc dev server was started.
  - Verification status before fresh verifier: `SELF_VERIFIED_AWAITING_FRESH_VERIFIER`; harness, lint, typecheck, web build, Storybook build, DOM proof, UI review, and `git diff --check` passed.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-011-input-help-tooltip-final-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-30-slice-011-input-help-tooltip-final.md`
    - `.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-harness-final-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-web-lint-final-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-web-typecheck-final-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-web-build-final-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-web-build-storybook-final-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-storybook-dom-proof-final-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-company-runtime-proof-final-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-ui-review-final-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-diff-check-final-2026-04-30.txt`

- Equipment archive action parity:
  - Read `.impeccable.md`, `docs/design/ui-workflow.md`, current Stage 03 `sprint_contract.md`, and current Stage 03 evidence before implementation.
  - Ran Storybook lookup for `archive action button equipment registry confirm dialog destructive`.
  - Reuse decision: `reuse`; matched `Equipment/EquipmentRegistryWorkspace`, `Primitives/ConfirmDialog`, and `Primitives/Dialog`.
  - Changed only `apps/web/features/Stage03Equipment/ui/EquipmentRegistryWorkspace.tsx` production code for the archive trigger visual treatment.
  - Preserved current shared `ConfirmDialog`, archive API calls, loading state, toast behavior, and archive visibility route state.
  - Web Interface Guidelines review: `PASS`.
  - Runtime note: `localhost:3100` responded with HTTP 200 but served a stale bundle, so runtime screenshot proof for the new TSX classes was not claimed and no ad-hoc preview server was started.
  - Canonical docs: not changed; visual parity only.
  - Verification status before fresh verifier: `PASS` for harness, web typecheck, web lint, web build, Storybook build, source audit, UI review, and diff check.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-011-equipment-archive-action-parity-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-30-equipment-archive.md`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-harness-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-web-typecheck-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-web-lint-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-web-build-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-storybook-build-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-source-audit-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-ui-review-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-localhost-3100-head-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-runtime-note-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-diff-check-2026-04-30.txt`

- Equipment registry declutter:
  - Read `.impeccable.md`, `docs/design/ui-workflow.md`, `docs/design/serviceops-design-system.md`, `docs/architecture/frontend-architecture.md`, `docs/architecture/documentation-workflow.md`, and the Stage 03 roadmap/evidence context before implementation.
  - Ran Storybook lookup for `equipment registry archive toggle compact tabs toolbar`.
  - Reuse decision: `reuse`; matched `Equipment/EquipmentRegistryWorkspace`, `Primitives/Tabs`, and `Contracts/ContractsRegistry`.
  - Changed the logged-in customer `/equipment` page header from a large `PageHeader` card to a compact `h1` + capability badge row.
  - Removed duplicated manageability note, access-area KPI card, and the separate archive description island from `EquipmentRegistryWorkspace`.
  - Preserved the three registry KPI cards, the existing `Tabs` navigation, `buildEquipmentRoute`, `handleArchiveVisibilityChange`, and the `?archived=1` URL contract.
  - Moved archive visibility into the tab row as a compact shared `Button` with `Archive` icon and `aria-pressed`.
  - Updated focused smoke assertions for the new `Архив показан` button state and retained read-only badge.
  - Web Interface Guidelines review: `PASS`.
  - Runtime note: `localhost:3100` responded with HTTP 200; no ad-hoc preview server was started.
  - Canonical docs: not changed; visual decluttering only.
  - Verification status before fresh verifier: `SELF_VERIFIED_AWAITING_FRESH_VERIFIER`; harness, lint, typecheck, web build, Storybook build, source audit, UI review, JSON audit, post-evidence harness, and `git diff --check` passed.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-012-equipment-registry-declutter-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-30-equipment-declutter.md`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-harness-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-web-lint-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-web-typecheck-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-web-build-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-storybook-build-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-ui-review-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-localhost-3100-head-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-source-audit-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-diff-check-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-json-audit-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-012-equipment-registry-declutter-harness-post-evidence-2026-04-30.txt`

- Access confirmation dialogs:
  - Used `$vrk-web-ui-workflow` and the shared UI source-of-truth docs for a bounded Stage 03 UI correction.
  - Ran Storybook lookup for `access employee invite confirmation dialog destructive`.
  - Reuse decision: `reuse`; matched `Primitives/ConfirmDialog`, `Access/EmployeeAccessWorkspace`, and `Access/EmployeeInviteManager`.
  - Changed `apps/web/features/Stage03Access/ui/EmployeeAccessWorkspace.tsx` so `Отключить` opens shared `ConfirmDialog` with title `Отключить сотрудника?`, `UserX` danger icon, employee-specific copy, and the existing deactivate mutation.
  - Changed `apps/web/features/Stage03Access/ui/EmployeeInviteManager.tsx` so `Отозвать` opens shared `ConfirmDialog` with title `Отозвать приглашение?`, `MailX` danger icon, invite-specific copy, and the existing revoke mutation.
  - Removed the obsolete Storybook runtime `window.confirm` shim and replaced the remaining company structure native archive confirmation with the same shared `ConfirmDialog` pattern.
  - Added focused Storybook play coverage for opening, canceling, and confirming employee deactivation and invite revocation.
  - Web Interface Guidelines review: `PASS`.
  - Runtime note: `localhost:3100/company` responded with HTTP 200; no ad-hoc dev server was started.
  - Canonical docs: not changed; confirmation surface only, APIs and lifecycle rules unchanged.
  - Verification status before fresh verifier: `SELF_VERIFIED_AWAITING_FRESH_VERIFIER`; harness, lint, typecheck, web build, Storybook build, source audit, UI review, runtime HEAD check, JSON audit, and `git diff --check` passed.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-013-access-confirmation-dialogs-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-30-slice-013-access-confirmation-dialogs.md`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-harness-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-web-lint-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-web-typecheck-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-web-build-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-storybook-build-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-source-audit-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-ui-review-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-localhost-3100-company-head-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-json-audit-before-evidence-2026-04-30.txt`
    - `.agent/stages/03-identity-master-data/raw/slice-013-access-confirmation-dialogs-diff-check-2026-04-30.txt`

- Company profile/access continuation:
  - Fixed contract update authorization so scoped admins cannot update contracts outside their visible scope/subtree.
  - Added `TestAgreementUpdateRejectsContractOutsideVisibleScope`.
  - Updated `ContractsRegistry` to derive available contract scopes from `session.workspace`, `session.divisions`, and `session.units`.
  - Added `DivisionAdminScoped` and `UnitAdminScoped` Storybook stories for the contracts registry.
  - Updated Storybook runtime mock contract creation to derive `locationScope` from `divisionId` / `unitId`.
  - Updated active proof/stage artifacts to `ООО` / `ПАО` / `НАО` / `ИП`, with `АО -> НАО`, `ЗАО -> НАО`, `ОАО -> ПАО`, and `LLC -> ООО`.
  - Updated `docs/design/diagrams/customer-admin-bootstrap-flow.drawio` visible measuring-instrument label to `ФИФ`.
  - Web Interface Guidelines review: `PASS`.
  - Verification status: `PASS` for backend, web, compose config, existing compose smoke, XML/JSON/stale-text audits, and proof script compile.
  - Raw:
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-backend-go-test-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-backend-go-build-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-web-lint-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-web-typecheck-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-web-build-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-storybook-build-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-compose-config-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-platform-smoke-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-proof-pycompile-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-json-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-drawio-xml-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-stale-doc-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-registration-label-audit-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/company-profile-access-ui-review-2026-04-29.txt`
    - `.agent/stages/03-identity-master-data/raw/storybook-lookup-company-profile-access-contracts-2026-04-29.txt`

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
  - Canonical role templates are `organization_admin`, `organization_head`, `division_admin`, `division_head`, `division_operator`, `unit_admin`, `unit_head`, `unit_operator`, and `auditor`.
  - Scope compatibility is enforced: organization roles only on `organization`, division roles only on `division`, unit roles only on `unit`, and `auditor` on any of the three scopes.
  - Stage 03 v1 mutate capabilities are active for customer `organization_admin`, `division_admin`, and `unit_admin`, each constrained to its compatible scope; non-admin roles remain scope-aware read-only.
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
  - Updated `docs/design/diagrams/customer-admin-bootstrap-flow.drawio` so the visible legal-form examples are `ООО, ПАО, НАО, ИП`.
  - `rg -n "LLC -> ООО" docs/roadmap.md docs/design/customer-admin-bootstrap-flow.md`
  - `rg -n "Организационно-правовая.*ООО, ПАО, НАО, ИП" docs/design/diagrams/customer-admin-bootstrap-flow.drawio`
  - drawio stale option/alias absence audit for `АО, ЗАО, ООО, ИП`, `ОАО`, and `ЗАО`
  - `xmllint --noout docs/design/diagrams/customer-admin-bootstrap-flow.drawio`
  - `jq empty .agent/stages/03-identity-master-data/evidence.json`
  - Status: `PASS`
  - Raw: `.agent/stages/03-identity-master-data/raw/slice-010-newton-doc-drift-fixer-2026-04-29.txt`

- Legal-type correction builder rerun:
  - Corrected the stale field contract so organization `Тип` / `propertyType` is legal form `ООО` / `ПАО` / `НАО` / `ИП`, division/branch has no selectable type, and unit type remains `ВРД` / `ВРЗ` / `ВУ` / `ВРП`.
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
  - The doc-only fixer added explicit `LLC -> ООО` alongside `АО -> НАО`, `ОАО -> ПАО`, and `ЗАО -> НАО` in the roadmap and customer-admin bootstrap flow docs, and updated the Draw.io source to show visible legal-form options `ООО, ПАО, НАО, ИП`.
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
  - accepted visible legal forms are `ООО`, `ПАО`, `НАО`, `ИП`;
  - legacy inputs normalize as `АО -> НАО`, `ОАО -> ПАО`, `ЗАО -> НАО`, `LLC -> ООО`;
  - operational values such as `ВРД` are rejected for organization legal form.
- Canonical field contract:
  - `docs/architecture/identity-master-data.md` now records differentiated type semantics: organization `propertyType`/`type` alias is ОПФ `ООО`/`ПАО`/`НАО`/`ИП`, division/branch has no selectable type and uses hidden storage default `division`, and unit `type` is `ВРД`/`ВРЗ`/`ВУ`/`ВРП`;
  - the same doc records `registeredAddress`/`address` and `leaderFullName`/`managerName` alias semantics, remaining business fields, preserved `region`/`status`/`comment`, and active-only archive/selection constraints for `/company`.
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

Newton doc-drift fixer update: `docs/roadmap.md`, `docs/design/customer-admin-bootstrap-flow.md`, and `docs/design/diagrams/customer-admin-bootstrap-flow.drawio` now align with the compatibility mappings and the visible selector set `ООО`, `ПАО`, `НАО`, `ИП`.

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

## Structure Code Removal

- User correction on 2026-04-29: the division/unit short identifier field is not a product requirement and should be removed from application, docs, and harness.
- Implementation:
  - `000014_remove_structure_code` drops `auth_divisions.code` and `auth_units.code`;
  - backend request/response models, repository writes, sqlc queries/generated code, and Swagger no longer expose the field;
  - `/company` create/edit forms, node metadata, web API types, and Storybook runtime fixtures/mocks no longer read or send the field;
  - canonical docs and Stage 03 artifacts now list only the remaining structure fields.
- UI workflow:
  - `$vrk-web-ui-workflow` was used;
  - no new reusable UI family was created, so Storybook component lookup/backlog changes were not required for this removal;
  - Web Interface Guidelines review of the changed company UI found no new blocking issue because the change only removes one optional input and keeps existing labels, controls, and dialog behavior.
- Proof run in this worktree:
  - Docker sqlc generation;
  - Docker Swagger generation;
  - Docker `go test ./...`;
  - Docker `go build -buildvcs=false ./...`;
  - `PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run lint`;
  - `PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run typecheck`;
  - `PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run build`;
  - `PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run build-storybook`;
  - `python3 -m py_compile` for updated Stage 03 proof scripts;
  - stage harness self-check;
  - targeted obsolete-field `rg` guard;
  - `git diff --check`.
