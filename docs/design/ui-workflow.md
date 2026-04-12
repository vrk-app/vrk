# VRK UI Workflow

Статус: accepted  
Обновлено: 2026-04-12

## Назначение

Этот документ фиксирует единый workflow для генерации и приемки web UI в VRK. В проекте не должно быть двух конкурирующих design-пайплайнов.

## Канонический workflow

Для новых web-компонентов, страниц и UI-рефакторингов использовать один и тот же поток:

1. Прочитать `docs/design/serviceops-design-system.md`.
2. Для Storybook/component-library задач прочитать `docs/design/storybook-component-backlog.md`.
3. Прочитать repo-root `.impeccable.md`.
4. Если контекст недостаточен, запустить `$impeccable teach`.
5. Для net-new UI или крупных новых поверхностей использовать `$impeccable craft`.
6. Для финального выравнивания использовать `$polish`.
7. Прогнать `$web-design-guidelines` по измененным UI-файлам.
8. Не считать UI slice завершенным, пока findings не закрыты или не задокументированы как сознательно принятые исключения.

## Инструменты

### Primary generator and refinement

- `$impeccable`
- `$polish`

### Primary review gate

- `$web-design-guidelines`

## Политика проекта

- `frontend-design` не используется напрямую, если `Impeccable` доступен.
- `frontend-design` допустим только как аварийный fallback, если `Impeccable` недоступен или сломан.
- Разрешенный visual tone для VRK: `industrial / utilitarian / high-clarity B2B`.
- `docs/design/serviceops-design-system.md` является каноническим источником токенов, state rules и component API ожиданий для VRK UI.
- Не создавать отдельные `.impeccable` файлы по surface. Общий контекст живет в `.impeccable.md`, а различия customer/contractor screen передаются в конкретном prompt.

## Repo-local artifacts

- Design system source of truth: [`docs/design/serviceops-design-system.md`](/Users/yura-posledov/cursor/vrk/docs/design/serviceops-design-system.md)
- Shared design context: [`.impeccable.md`](/Users/yura-posledov/cursor/vrk/.impeccable.md)
- Storybook source backlog: [`docs/design/storybook-component-backlog.md`](/Users/yura-posledov/cursor/vrk/docs/design/storybook-component-backlog.md)
- Standalone design skill: [`.agents/skills/vrk-web-ui-design`](/Users/yura-posledov/cursor/vrk/.agents/skills/vrk-web-ui-design)
- Wrapper skill: [`.agents/skills/vrk-web-ui-workflow`](/Users/yura-posledov/cursor/vrk/.agents/skills/vrk-web-ui-workflow)
- Pinned vendor copy:
  - [`.agents/skills/vendor/impeccable`](/Users/yura-posledov/cursor/vrk/.agents/skills/vendor/impeccable)
  - [`.agents/skills/vendor/polish`](/Users/yura-posledov/cursor/vrk/.agents/skills/vendor/polish)

## Pinned upstream

- Upstream repo: [pbakaus/impeccable](https://github.com/pbakaus/impeccable)
- Pinned commit for vendor copy: `00d485659af82982aef0328d0419c49a2716d123`

## Harness integration

Если slice затрагивает `apps/web` или другие frontend-пути:

- builder обязан использовать `$vrk-web-ui-workflow`;
- builder обязан сверить tokens и component rules с `docs/design/serviceops-design-system.md`;
- builder обязан сверить Storybook/component scope с `docs/design/storybook-component-backlog.md`, если slice относится к component library или showcase stories;
- verifier обязан проверить review gate через `$web-design-guidelines`;
- evidence должно содержать:
  - prompt/brief source;
  - подтверждение, что design-system source of truth был прочитан;
  - подтверждение, что Storybook backlog был прочитан, если slice относится к component library;
  - changed UI files;
  - результат UI review;
  - краткое подтверждение закрытия findings, если они были.

## Skill split

- Используй `$vrk-web-ui-design` для обычных ручных задач по дизайну/реализации web UI.
- Используй `$vrk-web-ui-workflow` для stage-driven задач, где кроме дизайна нужен evidence/proof flow внутри `.agent/stages/...`.
