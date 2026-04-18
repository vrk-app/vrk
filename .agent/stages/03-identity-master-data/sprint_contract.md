# Sprint Contract

- Stage ID: 03-identity-master-data
- Slice ID: slice-001-first-admin-activation-and-org-graph

## Objective

Запустить первый доказуемый Stage 03 slice: platform admin создает organization shell, отправляет first-admin invite, приглашенный администратор активируется через одноразовую ссылку, попадает в launch wizard и сохраняет core organization data вместе с первым подразделением или первым юнитом.

## Acceptance criteria

- platform admin может создать organization shell и first-admin invite;
- приглашенный администратор принимает invite и задает пароль;
- после входа пользователь попадает в launch wizard, а не в пустой dashboard;
- wizard позволяет сохранить core organization fields;
- wizard позволяет создать первое подразделение или сразу первый юнит;
- unit может быть создан без обязательного промежуточного подразделения;
- создается membership и initial organization-admin scoped grant для приглашенного администратора;
- канонические docs и stage artifacts синхронизированы с новым slice.

## Transition / dependency rules

- Slice starts on top of the proven Stage 02 runtime/platform floor.
- Slice may rely on the existing `apps/field`, CI, and root startup/smoke proof as platform baseline, but must not turn that into justification for widening Stage 03 scope.
- Slice must preserve the truthful boundary of the Stage 02 runtime shell until live Stage 03 contracts are actually implemented.
- If Stage 03 changes runtime bootstrap assumptions during the slice, refresh the Stage 03 docs/evidence before proof.

## File / module ownership

- `apps/backend/internal/app/**`
- `apps/backend/internal/auth/**`
- `apps/backend/internal/db/**`
- `apps/backend/migrations/**`
- `apps/backend/docs/swagger/**`
- `apps/web/app/login/**`
- `apps/web/app/register/**`
- `apps/web/app/(runtime)/**`
- `apps/web/features/**`
- `apps/web/entities/**`
- `apps/web/shared/**`
- `docs/roadmap.md`
- `docs/PRD-MVP.md`
- `docs/architecture/identity-master-data.md`
- `docs/architecture/frontend-architecture.md`
- `docs/design/customer-admin-bootstrap-flow.md`
- `.agent/stages/03-identity-master-data/**`

## Build / test plan

- schema migration for first-admin invite, membership, access grant, and org graph baseline;
- backend route wiring for invite inspect/accept and first org/subdivision/unit creation;
- backend unit/integration tests for invite activation and org graph persistence;
- swagger regeneration or equivalent OpenAPI refresh for the changed endpoints;
- web UI implementation for invite acceptance and launch wizard on top of the existing Stage 02 shell;
- web smoke for invite acceptance and launch wizard routes;
- API contract verification for organization, invite, membership, and unit endpoints;
- evidence collection for activation flow and wizard walkthrough.

## Proof requirements

- record the activation flow end-to-end with commands and captured outputs;
- show that the invite token cannot be replayed as a second successful first-admin activation;
- prove that core organization data and first subdivision/unit persist correctly;
- prove that the invited admin receives organization-level access;
- capture the exact routes/screens involved in the acceptance + wizard path;
- list all canonical docs updated for the slice;
- keep `verdict.json` pending until a fresh verifier reviews the implemented slice.

## Non-goals

- employee invitation lifecycle beyond the first admin;
- contracts registry and contractor routing;
- full scoped-access matrix for subdivision/unit viewers and managers;
- equipment, measuring instruments, standards, and metrology journals;
- custom roles, 2FA, bulk import, and external identity providers.
