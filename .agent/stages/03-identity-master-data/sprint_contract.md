# Sprint Contract

- Stage ID: 03-identity-master-data
- Slice ID: `slice-010-stage03-org-structure-management`
- Status: `PENDING` until implementation evidence and one fresh verifier `PASS`

## Objective

Replace the historical first-admin launch wizard target with a persistent `/company` organization structure management surface.

This correction must stay bounded to Stage 03 identity/master-data behavior:

- first-admin invite acceptance lands on `/company`, not `/company/setup`;
- `/company` becomes the durable place to view, edit, create, and archive organization profile, divisions/branches, and units;
- organization admins can create first and repeat structure nodes at any time;
- scoped division/unit admins can manage the allowed structure/access/employees/equipment/contracts slice inside their subtree; non-admin scoped users remain read-only;
- employee invite creation no longer depends on a completed wizard gate, while division/unit invite target validation remains strict.

Do not widen this slice into Stage 04 request flows, request creation, contractor execution, materials, schedules, or operations loops.

## Frozen Decisions

- `/company/setup` and `POST /launch-wizard` are historical implementation artifacts, not the product target for new Stage 03 proof.
- The target route after successful first-admin accept is `/company`; any remaining `/company/setup` route must be non-canonical and must not be required for normal activation.
- `requiresLaunchWizard` must not block `/company` or employee invite management once an explicit active session exists; contracts/equipment routes may keep their own existing Stage 03 master-data prerequisites.
- Organization structure management is persistent master data, not a one-time onboarding task.
- Unit parent division is optional:
  - `organization -> division -> unit` is valid;
  - `organization -> unit` is equally valid.
- Archive replaces delete for divisions and units.
- Canonical role templates are `organization_admin`, `organization_head`, `division_admin`, `division_head`, `division_operator`, `unit_admin`, `unit_head`, `unit_operator`, and `auditor`.
- Role/scope compatibility is strict: organization roles only use organization scope, division roles only use division scope, unit roles only use unit scope, and `auditor` may use organization, division, or unit scope.
- Mutation authority is granted to active customer `organization_admin`, `division_admin`, and `unit_admin` according to their scope; organization profile remains organization-admin-only.
- Division-scope and unit-scope users read only their visible subtree; they must not receive broader graph data or mutate controls.
- Stage 03 stays singular-session and grant-scoped; do not add a workspace picker/switcher UI.

## Data Contract

The persistent `/company` profile and org-structure forms must expose and persist these business fields where the record type carries them:

- organization `propertyType` / `type` compatibility alias: legal-form selector with exactly these visible values for the correction slice: `ООО`, `ПАО`, `НАО`, `ИП`;
- legacy organization legal-form input maps `АО -> НАО`, `ЗАО -> НАО`, `ОАО -> ПАО`, and `LLC -> ООО`; those legacy aliases are not visible selector options;
- division/branch `type`: not user-facing and not selectable; keep the existing `auth_divisions.division_type` storage/API shape with hidden internal default `division`;
- unit `type`: selector with exactly these operational values for the correction slice: `ВРД`, `ВРЗ`, `ВУ`, `ВРП`;
- `name`;
- `registeredAddress` as the canonical organization address field;
- `address` as a compatibility/display alias where existing division/unit APIs or payloads still use it;
- `leaderFullName` as the canonical leader display field;
- `managerName` remains a migration/read-display compatibility alias when existing stored data or session payloads still carry that field;
- `leaderPosition`;
- `contractPhone`;
- `contractEmail`;
- `actingBasis`;
- preserve `region`, `status`, and `comment` if current backend/session/UI contracts still consume them.

Optional requisites and logo metadata are in scope for this continuation slice. No hard requirement is introduced for document upload, Excel import, external registry sync, or custom role building.

## Acceptance Criteria

- First-admin activation:
  - accepting a valid first-admin invite creates/restores the explicit active session and lands on `/company`;
  - fresh acceptance proof shows no normal redirect to `/company/setup`;
  - replay/expired/revoked invite behavior remains unchanged and does not create duplicate membership/session side effects.
- `/company` states:
  - empty organization state shows profile data and available organization-admin actions before any division or unit exists;
  - partial state works for organization with profile-only data, division without units, and direct unit without division;
  - populated state shows divisions, direct organization units, and units under divisions in one readable structure surface;
  - state rendering remains truthful for missing optional fields and does not claim Stage 04 request readiness.
- Organization profile and business fields:
  - create/edit flows handle legal-form `propertyType`/`type` alias, `name`, `registeredAddress`/`address`, `leaderFullName`/`managerName`, `leaderPosition`, `contractPhone`, `contractEmail`, and `actingBasis`;
  - visible profile type selector shows `ООО`, `ПАО`, `НАО`, `ИП` only, while legacy `АО`, `ОАО`, `ЗАО`, and `LLC` inputs normalize for compatibility;
  - optional requisites validate digit-only formats and `ИП` clears/disables `КПП`;
  - logo upload stores only private object key and metadata in Postgres;
  - existing `region`, `status`, and `comment` fields remain visible/preserved if still used by the model;
  - saved data survives session restore and is reflected in `/company`.
- Division/branch management:
  - organization admin can create the first division/branch from `/company`;
  - organization admin can create a subsequent division/branch from the same UI;
  - create/edit does not expose or require a user-facing `type` selector and persists business fields above;
  - backend stores hidden default division type only for storage/generated-response compatibility;
  - archive is available instead of delete and removes archived nodes from default active selection.
- Unit management:
  - organization admin can create the first unit from `/company`;
  - organization admin can create repeat units from the same UI;
  - unit can be created under a division;
  - unit can be created directly under the organization;
  - create/edit uses the frozen unit type selector values `ВРД`, `ВРЗ`, `ВУ`, `ВРП` and business fields above;
  - archive is available instead of delete and removes archived units from default active selection.
- Archive behavior:
  - no hard-delete UI action is introduced for divisions or units;
  - backend/API behavior preserves archived rows;
  - active create/select flows do not target archived parent scopes;
  - archive requests return truthful blocking errors if active equipment, active scoped grants, or other Stage 03 references prevent safe archive.
- Access control:
  - only customer organization-scope `organization_admin` can mutate organization profile, divisions, and units;
  - `organization_head`, `division_head`, `division_operator`, `unit_head`, `unit_operator`, and `auditor` do not receive Stage 03 mutate capabilities in v1;
  - division-scope users can read only the target division and child units;
  - unit-scope users can read only the target unit;
  - scoped users see no create/edit/archive controls and backend mutation attempts are rejected.
- Employee invites:
  - active organization admin can create an organization-scope employee invite without completing any wizard and before any division/unit exists;
  - division-scope invite requires an existing visible active division target;
  - unit-scope invite requires an existing visible active unit target;
  - hidden, archived, missing, or out-of-scope target IDs are rejected truthfully;
  - invite lifecycle statuses from prior Stage 03 proof remain intact.
- Non-regression:
  - session restore still binds to explicit `membership_id + grant_id`;
  - direct login with multiple eligible access paths still returns truthful `409`;
  - contractor `/contracts` landing remains unchanged;
  - `/equipment` remains outside this slice except for entry links that require an existing visible active unit.

## Proof Requirements

- Harness:
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
- Backend:
  - update migrations/sqlc/OpenAPI if the org-structure contract changes persistence or public API;
  - `PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH /Users/yura-posledov/cursor/vrk/.agent/tmp-tools/sqlc generate -f apps/backend/sqlc.yaml` when SQL changes;
  - `cd apps/backend && env PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH go test ./...`;
  - `cd apps/backend && env PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH go build -buildvcs=false ./...`;
  - focused proof for first-admin accept to `/company`, org profile legal-form validation/legacy aliases, division without user-facing type, unit type validation, org/division/unit create/edit/archive, access rejection, and employee invite target validation.
- Web:
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run typecheck`;
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run lint`;
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run build`;
  - browser/runtime smoke for `/register/[token] -> /company`, `/company` legal-form options `ООО`/`ПАО`/`НАО`/`ИП`, no division type selector, unit type selector, empty/partial/populated states, org-admin profile controls, scoped admin controls, and scoped read-only views.
- UI review:
  - use `$vrk-web-ui-workflow` for implementation;
  - run `$web-design-guidelines` on touched UI files and close findings before claiming done.
- Verifier:
  - one fresh verifier must independently reproduce the slice-010 acceptance;
  - verifier must not edit production code;
  - `feature_list.json` entries for this correction remain `passes: false` until that verifier returns `PASS`.

## Mandatory UI Workflow

This slice touches `apps/web`, so the reuse-first VRK UI workflow is mandatory.

- Design context to read before implementation:
  - `.impeccable.md`
  - `docs/design/ui-workflow.md`
  - `docs/design/serviceops-design-system.md`
  - `docs/architecture/frontend-architecture.md`
  - `docs/design/storybook-component-backlog.md`
- Component lookup target:
  - `company organization structure management profile division unit invite scope empty partial populated form archive`
- Secondary lookup target for expected primitive reuse:
  - `input select textarea tabs inline alert card button invite organization form`
- Expected lookup result:
  - current Storybook inventory does not contain a complete organization-structure management family;
  - primitive candidates exist for forms and state messaging: `Button`, `Card`, `InputField`, `SelectField`, `TextareaField`, `InlineAlert`, and `Tabs`;
  - existing feature-local surfaces `EmployeeInviteManager` and Stage 03 bootstrap/session helpers should be reused or adapted instead of creating parallel invite/auth UI.
- Expected reuse strategy:
  - reuse shared primitives and current runtime shell;
  - extend feature-local Stage 03 company/structure components if needed;
  - create a net-new reusable/domain component only if lookup proves no viable candidate, and then add stories plus update `docs/design/storybook-component-backlog.md`;
  - remove or bypass launch-wizard dependency through route/data behavior, not by introducing a second onboarding family.

## File / Module Ownership

- `apps/backend/internal/auth/**`
- `apps/backend/internal/app/**`
- `apps/backend/internal/db/**`
- `apps/backend/migrations/**`
- `apps/backend/docs/swagger/**`
- `apps/web/app/(runtime)/company/**`
- `apps/web/app/(runtime)/company/setup/**`
- `apps/web/app/api/auth/**`
- `apps/web/app/api/company/**` if introduced
- `apps/web/features/Stage03Bootstrap/**`
- `apps/web/features/Stage03Access/**`
- `apps/web/shared/api/**`
- `apps/web/shared/ui/**` only when extending existing primitives is justified
- `apps/web/tests/**`
- `.agent/stages/03-identity-master-data/**`

## Canonical Doc Targets If Slice Lands

- `docs/roadmap.md`
  - keep Stage 03 acceptance aligned to persistent `/company`;
  - keep Stage 04 request flows out of Stage 03.
- `docs/architecture/identity-master-data.md`
  - update the activation/org-structure diagrams if route or API flow changes;
  - document the final business field aliases and archive constraints.
- `docs/design/customer-admin-bootstrap-flow.md`
  - update route contour diagrams for `/register/[token] -> /company`;
  - keep `/company/setup` marked historical/non-canonical if it remains in code.
- `docs/architecture/frontend-architecture.md`
  - update runtime contour and web boundary diagrams for persistent `/company` management;
  - record component reuse/story evidence if new UI families land.
- `docs/PRD-MVP.md`
  - update only if product wording still says launch wizard is the target.
- `docs/design/storybook-component-backlog.md`
  - update only if the builder creates a new reusable/domain component family or missing backlog slice.
- `apps/backend/docs/swagger/**`
  - refresh if endpoint contracts, payload fields, archive endpoints, or session summary shapes change.

## Non-Goals

- Stage 04 request creation, request routing UI, request detail lifecycle, or request readiness proof;
- contractor execution, materials, schedules, acceptance, estimates, or documents;
- full platform identity/RBAC rewrite;
- multi-workspace picker/switcher;
- Yandex ID, 2FA, Excel import, external organization registry sync, or custom role builder;
- replacing contracts/equipment/metrology proof outside the minimal links needed from `/company`;
- generic cleanup of unrelated dirty worktree paths.
