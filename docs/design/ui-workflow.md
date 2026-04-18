# VRK UI Workflow

Статус: accepted  
Обновлено: 2026-04-17

## Назначение

Этот документ фиксирует единый workflow для генерации и приемки web UI в VRK. В проекте не должно быть двух конкурирующих design-пайплайнов.

## Канонический workflow

Для новых web-компонентов, страниц и UI-рефакторингов использовать один и тот же поток:

1. Прочитать `docs/design/serviceops-design-system.md`.
2. Прочитать `docs/architecture/frontend-architecture.md`.
3. Для Storybook/component-library задач прочитать `docs/design/storybook-component-backlog.md`.
4. Прочитать repo-root `.impeccable.md`.
5. Для reusable/domain UI, Storybook stories и заметных UI-рефакторингов прогнать repo-local lookup helper `python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "<need>"`.
6. Зафиксировать решение `reuse` / `extend` / `create` до начала реализации.
7. Если контекст недостаточен, запустить `$impeccable teach`.
8. Для net-new UI или крупных новых поверхностей использовать `$impeccable craft`.
9. Для финального выравнивания использовать `$polish`.
10. Прогнать `$web-design-guidelines` по измененным UI-файлам.
11. Не считать UI slice завершенным, пока findings не закрыты или не задокументированы как сознательно принятые исключения.

## Reuse-First Policy

Для shared primitives, domain UI и Storybook-backed компонентов действует строгий порядок решений:

1. `reuse`: если существующий Storybook-backed компонент уже покрывает задачу, использовать его без создания новой семьи.
2. `extend`: если существующий компонент почти подходит, расширить его API, variants или states и обновить stories этого же компонента.
3. `create`: создавать новый компонент только если lookup не нашел жизнеспособного кандидата для безопасного reuse/extend.

Lookup helper является repo-local точкой входа в текущий Storybook inventory, а `docs/design/storybook-component-backlog.md` остается source backlog для планирования недостающих компонентов.

Примеры:

```bash
python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "request status badge"
python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "filter select field" --json > .agent/stages/<stage-id>/raw/storybook-component-lookup.json
```

Правила:

- Не создавать параллельный reusable component, если story-backed кандидат уже существует и может быть безопасно расширен.
- При `create` агент обязан явно зафиксировать, почему кандидаты были недостаточны.
- Net-new reusable component должен поставляться вместе со stories.
- Если появился новый reusable family или backlog-срез, которого еще нет в `docs/design/storybook-component-backlog.md`, нужно обновить backlog в той же logical slice.

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
- Frontend architecture baseline: [`docs/architecture/frontend-architecture.md`](/Users/yura-posledov/cursor/vrk/docs/architecture/frontend-architecture.md)
- Shared design context: [`.impeccable.md`](/Users/yura-posledov/cursor/vrk/.impeccable.md)
- Storybook source backlog: [`docs/design/storybook-component-backlog.md`](/Users/yura-posledov/cursor/vrk/docs/design/storybook-component-backlog.md)
- Storybook component lookup helper: [`.agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py`](/Users/yura-posledov/cursor/vrk/.agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py)
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
- builder обязан сверить slice boundaries и data-layer assumptions с `docs/architecture/frontend-architecture.md`;
- builder обязан сверить tokens и component rules с `docs/design/serviceops-design-system.md`;
- builder обязан сверить Storybook/component scope с `docs/design/storybook-component-backlog.md`, если slice относится к component library или showcase stories;
- builder обязан прогнать repo-local lookup helper перед созданием или заменой reusable/domain UI и зафиксировать решение `reuse` / `extend` / `create`;
- verifier обязан проверить review gate через `$web-design-guidelines`;
- verifier обязан считать proof gap хотя бы один из случаев: lookup пропущен, создан дублирующий reusable component, net-new component поставлен без stories, для нового reusable family пропущен backlog update;
- evidence должно содержать:
  - prompt/brief source;
  - подтверждение, что design-system source of truth был прочитан;
  - подтверждение, что Storybook backlog был прочитан, если slice относится к component library;
  - component lookup query или короткое описание потребности;
  - matched story refs или явный `no-match`;
  - reuse decision (`reuse` / `extend` / `create`);
  - rationale, если был выбран `create`;
  - backlog update note, если появился новый reusable family или missing backlog slice;
  - changed UI files;
  - результат UI review;
  - краткое подтверждение закрытия findings, если они были.

## Skill split

- Используй `$vrk-web-ui-design` для обычных ручных задач по дизайну/реализации web UI.
- Используй `$vrk-web-ui-workflow` для stage-driven задач, где кроме дизайна нужен evidence/proof flow внутри `.agent/stages/...`.
