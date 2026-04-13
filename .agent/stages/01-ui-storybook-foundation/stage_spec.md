# Stage Spec

- Stage ID: 01-ui-storybook-foundation
- Stage Name: UI Storybook foundation

## Objective

Подготовить Storybook-first UI foundation для VRK: зафиксировать component backlog, поднять `apps/web` и Storybook, codify design tokens и shared story helpers, а затем реализовать foundations и Wave 1 как reusable base для последующих business stages.

## In scope

- создать `apps/web` scaffold для UI foundation;
- установить и настроить Storybook как repo-local UI harness;
- зафиксировать `docs/design/storybook-component-backlog.md` как source backlog для component-library work;
- реализовать token/docs bridge между `docs/design/serviceops-design-system.md` и кодом;
- создать shared enums, mock data и story helpers для доменных stories;
- реализовать foundations (`TokenDocs`, `IconGallery`);
- реализовать Wave 1:
  - базовые UI primitives;
  - layout/navigation foundation;
  - auth baseline;
  - request list baseline;
- собрать минимальные showcase stories, доказывающие composability foundation-компонентов.

## Out of scope

- backend/runtime integration beyond UI scaffold;
- `apps/field` и offline contour;
- полный P1/P2 backlog из Storybook source document;
- закрытие всех dashboard/messenger/reporting surfaces в одной стадии;
- mark-as-done без Storybook proof, evidence и fresh verifier pass.

## Source documents

- docs/roadmap.md
- AGENTS.md
- docs/design/serviceops-design-system.md
- docs/design/ui-workflow.md
- docs/design/storybook-component-backlog.md
- .impeccable.md
- .agent/stages/00-harness-and-source-of-truth/progress.md
- .agent/stages/00-harness-and-source-of-truth/feature_list.json

## Acceptance criteria

- `apps/web` существует и содержит reproducible Storybook setup.
- `docs/design/storybook-component-backlog.md` является source backlog для Storybook/component work.
- design tokens, shared enums/mock data и story helpers существуют в коде и используются story slices.
- `TokenDocs` и `IconGallery` реализованы.
- Wave 1 компоненты реализованы со mandatory stories для интерактивных/data/adaptive states, где применимо.
- `AuthPage.Showcase` и `RequestsPage.Showcase` или эквивалентный composability baseline доказаны через Storybook.
- changed UI files проходят `$web-design-guidelines`.
- Stage 01 не считается завершенным без fresh verifier pass и evidence bundle.

## Technical ownership / paths

- `apps/web/`
- `docs/design/storybook-component-backlog.md`
- `docs/design/serviceops-design-system.md`
- `docs/design/ui-workflow.md`
- `.impeccable.md`
- `.agent/stages/01-ui-storybook-foundation/`

## Risks

- backlog intentionally шире, чем acceptance одной стадии; нужен строгий scope cut по sprint contracts;
- в репозитории пока нет `apps/web`, поэтому первый slice включает toolchain/bootstrap risk;
- легко расплодить parallel component families, если не держаться design-system tokens и wrapper policy;
- showcase stories могут незаметно начать тянуть business logic раньше времени;
- Storybook infrastructure не должна дублировать будущий app runtime из Stage 02.

## Verification plan

- установить зависимости и зафиксировать reproducible Storybook commands;
- прогнать install/build/story smoke для `apps/web`;
- собрать Storybook story references и/или screenshot evidence для foundations и Wave 1 showcase stories;
- прогнать `$web-design-guidelines` по changed UI files;
- обновить `evidence.md`, `evidence.json`, `feature_list.json`, `progress.md`, `verdict.json`;
- не закрывать Stage 01 без fresh verifier pass.
