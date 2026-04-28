# Sprint Contract

- Stage ID: 03-identity-master-data
- Slice IDs:
  - `slice-007-stage03-admin-surface-auth-hardening`
  - `slice-008-stage03-multi-org-session-contract`

## Objective

Закрыть оставшиеся Stage 03 remediation findings по admin/auth/session contract, не переоткрывая `slice-009` и не расширяя Stage 03 в multi-workspace picker UI или новую platform identity subsystem.

Текущий bounded remediation wave обязан:

- убрать анонимный mutate/read доступ к Stage 03 admin surface на `/api/v1/organizations*`;
- закрыть публичный `POST /api/v1/platform/organization-shells`, сохранив рабочий web `/register` через server-side Next boundary;
- ввести deployment-scoped platform-admin credential/header contract как Stage 03-safe переходный механизм;
- убрать arbitrary access selection через `LIMIT 1` при direct login/session restore;
- привязать каждую session к explicit active `membership_id + grant_id`;
- вернуть truthful `409` для direct login, если у аккаунта несколько eligible access paths;
- сохранить deterministic invite acceptance, потому что invite already scopes membership/grant;
- синхронизировать Swagger, env/runtime docs и узкие canonical docs по уточненному auth/admin/session contract.

Этот remediation wave не должен расширяться в Stage 04 request runtime, Stage 05 execution loops, полноценную platform identity систему, multi-workspace selector/switcher UI или unrelated cleanup из dirty worktree.

## Frozen contract decisions

- Stage 03 session остается singular.
- Session restore не делает новый выбор доступа: используется явно сохраненная `grant_id` текущей session.
- Direct login может автоматически завершиться только если найден ровно один eligible access path.
- Direct login при нескольких eligible memberships/grants должен возвращать truthful `409`, а не silently выбирать первый доступ.
- Invite acceptance flow может оставаться deterministic и сразу выпускать session, потому что invite already scopes membership/grant.
- Для `slice-007` допустим deployment-scoped shared secret в header `X-VRK-Platform-Admin-Secret`; secret живет только на server-side boundaries и не утекает в browser.

## Slice 007 acceptance criteria

- `/api/v1/organizations` list/create/get/update/delete больше не доступны анонимно:
  - все эти admin-surface paths требуют deployment-scoped platform-admin credential;
  - отсутствие или неверный credential дает truthful `401`;
  - Stage 03 user sessions не получают параллельный browser-facing путь к этим endpoints в обход server-side boundary.
- `POST /api/v1/platform/organization-shells` больше не публичный:
  - backend route требует `X-VRK-Platform-Admin-Secret`;
  - web `/api/platform/organization-shells` проксирует запрос server-side и inject-ит secret из server env;
  - browser code не читает и не сериализует secret в client bundle.
- Новый env/config contract зафиксирован truthfully:
  - backend не стартует без `PLATFORM_ADMIN_SHARED_SECRET`;
  - compose / examples / server-side web runtime docs отражают обязательность этого секрета.
- Swagger и canonical docs отражают новый admin auth contract без widening в полноценную platform identity систему.

## Slice 008 acceptance criteria

- `POST /api/v1/sessions` больше не выбирает arbitrary access path через `LIMIT 1`.
- Session persistence и restore используют explicit active `membership_id + grant_id`.
- Direct login contract truthfully classified:
  - `0` eligible access paths -> existing unauthorized contract;
  - `1` eligible access path -> session issue succeeds;
  - `>1` eligible access paths -> `409` с truthful access-selection error.
- Invite acceptance остается deterministic:
  - first-admin acceptance выпускает session с explicit `grant_id`;
  - employee acceptance/upsert path выпускает session с explicit `grant_id`;
  - replay/expired/revoked invite contracts не деградируют.
- Stage 03 не строит новый workspace picker/switcher UI; runtime продолжает использовать singular scoped landing, derived from explicit active grant.
- При SQL changes обновлены migration и `sqlc` artifacts.

## Proof requirements

- harness:
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
- backend:
  - `PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH /Users/yura-posledov/cursor/vrk/.agent/tmp-tools/sqlc generate -f apps/backend/sqlc.yaml`
  - `PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH go test ./...`
  - `PATH=/Users/yura-posledov/cursor/vrk/.agent/tmp-tools/go/bin:$PATH go build -buildvcs=false ./...`
  - Swagger refresh via local `swag init`
  - focused unit coverage for platform-admin middleware and `409` session conflict classification
- web:
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run typecheck`
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run lint`
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run build`
  - targeted auth smoke / focused proof for `/register`, login, and session restore if runtime stack is available; if blocked, record the exact environment reason and do not claim PASS for that sub-proof
- verifier:
  - fresh verifier must inspect admin header enforcement on `/organizations*` and `/platform/organization-shells`
  - fresh verifier must inspect explicit `grant_id` session binding and truthful `409` conflict path
  - verifier must not edit production code

## File / module ownership

- `apps/backend/internal/app/**`
- `apps/backend/internal/auth/bootstrap/**`
- `apps/backend/internal/auth/organization/**`
- `apps/backend/internal/db/queries/auth/bootstrap.sql`
- `apps/backend/internal/db/generated/**`
- `apps/backend/migrations/000010_stage03_session_explicit_grant_binding.*.sql`
- `apps/backend/internal/infrastructure/config/**`
- `apps/backend/docs/swagger/**`
- `apps/web/app/api/platform/organization-shells/route.ts`
- `apps/web/app/api/auth/session/route.ts`
- `apps/web/app/api/auth/session/current/route.ts`
- `apps/web/shared/api/{backend.ts,bootstrap.ts,route-proxy.ts,session-server.ts}`
- `apps/web/app/register/page.tsx`
- `apps/web/features/Stage03Bootstrap/ui/PlatformAdminInviteForm.tsx`
- `apps/web/tests/auth-flow.smoke.spec.ts`
- `apps/web/tests/contracts-routing.smoke.spec.ts`
- `apps/web/tests/equipment-registries.smoke.spec.ts`
- `docs/roadmap.md`
- `docs/architecture/identity-master-data.md`
- `docs/architecture/frontend-architecture.md`
- `docs/onboarding.md`
- `.agent/stages/03-identity-master-data/**`

## Mandatory UI workflow

Because this remediation wave still touches `apps/web`, the reuse-first Stage 03 UI workflow applies.

- Design context:
  - `.impeccable.md`
  - `docs/design/ui-workflow.md`
  - `docs/design/serviceops-design-system.md`
  - `docs/architecture/frontend-architecture.md`
  - `docs/design/storybook-component-backlog.md`
- Component lookup target:
  - `platform admin invite auth route proxy session conflict login restore register boundary`
- Expected lookup result:
  - reuse existing auth/layout primitives and feature-local forms; no new reusable component family is justified for this remediation wave.
- Expected reuse strategy:
  - keep `/register`, `/login`, and existing auth/bootstrap feature shells;
  - patch route-handler/server-boundary behavior instead of inventing a new auth UI family;
  - keep current runtime landing surfaces and avoid adding a workspace picker UI in Stage 03.

## Doc targets

- `docs/roadmap.md`
- `docs/architecture/identity-master-data.md`
- `docs/architecture/frontend-architecture.md`
- `docs/onboarding.md`
- `apps/backend/docs/swagger/**`

## Non-goals

- reopening `slice-009` in this run;
- multi-workspace picker/switcher UI;
- full platform identity / RBAC subsystem beyond the shared-secret admin gate;
- Stage 04 request flows;
- Stage 05 execution/materials/documents/acceptance flows;
- generic cleanup of dirty repo paths not required by findings `1`, `2`, `3`.
