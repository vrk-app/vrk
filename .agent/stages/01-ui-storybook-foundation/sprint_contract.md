# Sprint Contract

- Stage ID: 01-ui-storybook-foundation
- Slice ID: slice-001-storybook-scaffold-and-foundations

## Objective

Поднять `apps/web` и Storybook как reproducible UI harness, подключить token/story helper foundation и доказать workflow на foundations плюс первом батче Wave 1 компонентов.

## Acceptance criteria

- `apps/web` scaffold существует и содержит Storybook scripts/config.
- Shared story helpers покрывают базовые enums и mock data из backlog.
- `TokenDocs` и `IconGallery` реализованы и доступны в Storybook.
- Первый batch Wave 1 компонентов реализован как минимум для доказательства workflow:
  - `Button`
  - `InputField`
  - `Badge`
  - `Card`
- Для компонентов из текущего slice есть required stories для соответствующих states.
- Evidence содержит commands run, screenshots/story references и `$web-design-guidelines` result.

## File / module ownership

- `apps/web/`
- `docs/design/storybook-component-backlog.md`
- `.agent/stages/01-ui-storybook-foundation/`

## Build / test plan

- scaffold frontend app and Storybook config;
- run install/build/story smoke for `apps/web`;
- capture screenshots or Storybook evidence for foundations and the first Wave 1 stories;
- run `$web-design-guidelines` on changed UI files.

## Proof requirements

- reproducible Storybook commands recorded in `evidence.md`;
- screenshots or equivalent visual proof for `TokenDocs`, `IconGallery`, and the first Wave 1 stories;
- changed UI files list;
- UI review result;
- updated `feature_list.json`, `progress.md`, `evidence.md`, and `evidence.json`.

## Non-goals

- completion of the full Storybook backlog;
- backend integration or API data wiring;
- `apps/field` work;
- P1/P2 component delivery in this slice.
