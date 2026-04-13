# Sprint Contract

- Stage ID: 01-ui-storybook-foundation
- Slice ID: slice-002-wave1-shell-auth-request-showcases

## Objective

Закрыть оставшийся Stage 01 exit gate поверх уже доказанного scaffold: реализовать layout/navigation baseline, auth baseline, request-list baseline и showcase stories, которые докажут composability без ухода в Stage 02 runtime/integration work.

## Acceptance criteria

- Layout/navigation Wave 1 baseline реализован в Storybook:
  - `AppShell`
  - `SidebarNav`
  - `TopBar`
  - `Breadcrumbs`
  - `PageHeader`
- Auth baseline реализован в Storybook:
  - `AuthSplitLayout`
  - `LoginForm`
  - `ConsentRow`
- Request-list baseline реализован в Storybook:
  - `RequestStatusBadge`
  - `RequestListItem`
  - `RequestList`
- Composed showcase stories существуют и не тянут Stage 02 runtime wiring:
  - `Showcases/AuthPage`
  - `Showcases/RequestsPage`
- Для компонентов и showcases из текущего slice есть required stories/states по source backlog.
- Evidence содержит commands run, story references или screenshots, changed UI files и `$web-design-guidelines` result.

## File / module ownership

- `apps/web/`
- `docs/architecture/frontend-architecture.md`
- `.agent/stages/01-ui-storybook-foundation/`

## Build / test plan

- implement the remaining Stage 01 Wave 1 shell/auth/request-list surfaces in `apps/web`;
- compose `AuthPage` and `RequestsPage` Storybook showcases on top of reusable primitives;
- run `pnpm run web:typecheck`, `pnpm run web:lint`, `pnpm run web:build`, `pnpm run storybook:build`, and `pnpm run web:smoke`;
- capture Storybook references for the new layout/auth/request-list and showcase stories;
- run `$web-design-guidelines` on changed UI files.

## Proof requirements

- reproducible Storybook/build commands recorded in `evidence.md`;
- Storybook references or screenshots for shell/auth/request-list stories and both showcases;
- changed UI files list and design-brief sources captured in `evidence.json`;
- UI review result with closed findings, if any;
- updated `feature_list.json`, `progress.md`, `evidence.md`, `evidence.json`, and fresh verifier verdict for the current slice.

## Non-goals

- backend integration, real auth/session wiring, or API data loading;
- `apps/field` work;
- dashboard, messenger, registry, or reporting surfaces outside the Stage 01 exit gate;
- P1/P2 backlog items from the Storybook source document.
