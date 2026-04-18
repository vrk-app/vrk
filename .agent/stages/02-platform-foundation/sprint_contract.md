# Sprint Contract

- Stage ID: 02-platform-foundation
- Slice ID: slice-002-platform-baseline-health-ci-field

## Objective

Закрыть оставшийся platform baseline `Stage 02`: дать репозиторию reproducible root startup/smoke path, backend health/readiness baseline, `apps/field` PWA-first scaffold и CI hooks, не притворяясь, что Stage 03 auth/master-data или Stage 06 offline engine уже live.

## Acceptance criteria

- Root `make dev` или эквивалентный startup contract воспроизводимо поднимает `db`, backend, `apps/web`, `apps/field`.
- Root `make smoke` или эквивалентный smoke contract проверяет:
  - backend `health` / `ready`;
  - seeded API read smoke;
  - navigable `apps/web` runtime routes;
  - reachable `apps/field` PWA scaffold and manifest.
- Backend оставляет structured logs и не требует локального `go` для runtime startup smoke.
- `apps/field` существует как PWA-first scaffold с явной boundary copy:
  - offline drafts and manual sync are future behavior hooks;
  - Stage 06 offline engine не имитируется как live.
- Repo-level CI воспроизводимо гоняет lint/test/build/smoke для Stage 02 baseline.
- Canonical docs, Stage 02 artifacts и downstream Stage 03 handoff отражают, что platform tail закрыт.

## File / module ownership

- `Makefile`
- `compose.platform.yml`
- `.github/workflows/`
- `scripts/`
- `apps/backend/`
- `apps/field/`
- `apps/web/`
- `docs/architecture/frontend-architecture.md`
- `docs/architecture/source-of-truth.md`
- `docs/onboarding.md`
- `docs/testing/test-strategy.md`
- `.agent/stages/02-platform-foundation/`
- `.agent/stages/03-identity-master-data/`

## Build / test plan

- добавить root startup/smoke contract через контейнерный stack, чтобы baseline не зависел от локального `go`;
- в backend добавить `health` / `ready` endpoints и structured request/runtime logs;
- создать `apps/field` scaffold на repo-pinned Node/Next baseline с PWA manifest и explicit sync boundaries;
- обновить root JS workspace scripts и CI hooks для `web` + `field`;
- прогнать `pnpm run web:smoke`, `pnpm run field:smoke`;
- прогнать container-backed backend build/test path;
- поднять root stack через `make dev` и зафиксировать smoke outputs для backend/web/field;
- обновить stage evidence, canonical docs и Stage 03 handoff assumptions.

## Proof requirements

- smoke output для root startup path, backend health/readiness, seeded API smoke, web route walk и field manifest/page checks;
- output для container-backed backend `go test ./...` и `go build ./...`;
- evidence по `$vrk-web-ui-workflow` для `apps/field`: brief source, lookup refs, reuse decision, changed UI files и `$web-design-guidelines` result;
- явный список boundaries:
  - web auth/session по-прежнему shell-only;
  - field offline/manual sync пока только scaffold;
  - Stage 03/06 behavior не объявляется готовым;
- updated `feature_list.json`, `progress.md`, `evidence.md`, `evidence.json`, `verdict.json`;
- downstream Stage 03 artifacts refreshed where the previously-open Stage 02 tail was part of the execution gate.

## Non-goals

- real auth / refresh / RBAC;
- persisted org / subdivision / unit / equipment / contract CRUD;
- contractor invitation state machine с реальными статусами;
- live request creation / request detail contour;
- Stage 06 offline draft storage, conflict resolution и background sync engine;
- modernization и supply branches из imported Draw.io.
