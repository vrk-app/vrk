# Contributing

Руководство по работе с ветками, коммитами и Pull Request в `vrk`.

Документ опирается на текущее состояние репозитория:

- текущий runnable baseline находится в `apps/backend`;
- `docs/roadmap.md` и `.agent/stages/<stage-id>/` задают stage-based workflow для roadmap execution;
- `docs/architecture/source-of-truth.md` фиксирует порядок source of truth;
- `apps/web` и `apps/field` еще не являются частью текущего baseline, но правила для их появления уже нужно учитывать.

## 1. Базовые принципы

- `main` всегда должен оставаться в рабочем и mergeable состоянии.
- Любые изменения идут через Pull Request.
- Один PR = одна логическая задача.
- Один PR не должен смешивать feature, refactor, formatting, deps update и unrelated docs changes.
- Чем меньше PR, тем быстрее и качественнее ревью.
- Если работа привязана к roadmap stage, PR должен содержать один обозримый slice, а не весь stage целиком.

Для этого проекта также важно:

- не выходить за рамки `docs/PRD-MVP.md` и `docs/roadmap.md` без явного решения;
- не объявлять stage или feature завершенными без evidence и verifier pass;
- не оставлять содержательный documentation drift между кодом, stage evidence и каноническими docs;
- не тащить в PR случайные локальные файлы, временные артефакты и машинно-зависимые правки.

## 2. Source Of Truth Перед Работой

Перед началом изменений сверяйся с источниками в таком порядке:

1. текущее состояние репозитория и runnable baseline;
2. `docs/architecture/source-of-truth.md`;
3. `docs/PRD-MVP.md`;
4. `docs/roadmap.md`;
5. `README.md` и `BACKEND.md` как доменное пояснение, но не как разрешение расширять MVP.

Если PR меняет product behavior, architecture/workflow contract, API expectations или operating instructions, в том же PR нужно обновить соответствующие канонические docs. Stage artifacts и PR description не заменяют такие обновления.

Если PR сознательно меняет архитектурное решение, scope MVP или contract между модулями, это нужно явно описать в PR и при необходимости оформить отдельным ADR.

## 3. Единый Набор Типов

Один и тот же `<type>` используется в названиях веток, сообщениях коммитов и заголовках PR.

| Тип | Когда использовать |
| --- | --- |
| `feat` | Новая функциональность |
| `fix` | Исправление бага |
| `docs` | Документация |
| `refactor` | Переработка кода без изменения поведения |
| `perf` | Оптимизация производительности |
| `test` | Добавление или правка тестов |
| `style` | Форматирование и линтерные правки без изменения логики |
| `build` | Сборка, tooling, генерация, зависимости |
| `ci` | CI/CD, GitHub Actions и связанные сценарии |
| `chore` | Прочая рутина и техдолг без продуктового изменения |

## 4. Ветки

### 4.1. Формат

```text
<type>/<short-kebab-case>
```

Опционально можно добавить тикет:

```text
<type>/<ticket>-<short-kebab-case>
```

Если работа относится к конкретному roadmap stage, stage-id можно включить в краткое имя ветки:

```text
feat/02-platform-foundation-backend-smoke
fix/NCFG-132-auth-organization-validation
docs/contributing-guide
```

### 4.2. Правила

- Название ветки должно описывать одну задачу, а не набор разрозненных изменений.
- Не используй слишком общие ветки вроде `feat/update` или `fix/bugs`.
- Если в ходе работы обнаружилась вторая независимая задача, выноси ее в отдельную ветку и отдельный PR.

## 5. Коммиты

### 5.1. Формат

Используй Conventional Commits:

```text
<type>[(scope)]: <description>

[optional body]

[optional footer(s)]
```

Примеры:

- `feat(api): add agreement CRUD endpoints`
- `fix(auth): validate contractor organization access`
- `refactor(db): split application repository queries`
- `docs: add contributing guide`

### 5.2. Scope

Предпочитай узкие, понятные scope, отражающие реальную область изменения:

- `api` - REST handlers, request/response contract, Swagger surface
- `server` - app wiring, bootstrap, middleware, runtime composition
- `db` - migrations, sqlc queries, repositories, persistence contract
- `auth` - authentication and authorization logic
- `config` - env/config/runtime settings
- `deps` - dependency updates
- `ci` - CI workflows
- `ui`, `components`, `pages`, `routes` - когда в репозитории появится web/field UI

Для текущего backend baseline:

- предпочитай `api`, `server`, `db`, `auth`, `config`, а не общий `backend`;
- `backend` допустим только для действительно кросс-срезовых изменений внутри `apps/backend`, когда более точный scope будет искусственным.

### 5.3. Описание коммита

- Summary в сообщении коммита пиши на английском.
- Пиши summary в повелительном наклонении: `add`, `fix`, `update`, `remove`.
- Summary должен быть коротким и конкретным.
- Не описывай в одном коммите несколько независимых изменений.
- Если изменения нетривиальные, добавляй body с кратким объяснением что изменено и почему.

### 5.4. Breaking Changes

Если изменение ломает обратную совместимость:

1. добавь `!` после типа или scope:

```text
feat(api)!: change request status response schema
```

2. добавь footer:

```text
BREAKING CHANGE: request status response now returns enum code and label
```

## 6. Repo-Specific Правила Для Коммитов

### 6.1. Backend (`apps/backend`)

Если PR меняет backend-код, проверь, не нужно ли вместе с ним обновить связанные артефакты:

- изменения SQL schema должны идти вместе с парой миграций `up/down`;
- изменения SQL queries или схемы, влияющие на sqlc, должны сопровождаться обновлением generated-кода;
- изменения API contract или Swagger annotations должны сопровождаться обновлением `apps/backend/docs/swagger/*`;
- нельзя вручную править generated-файлы без изменения их source.

### 6.2. Future Web / Field Workspaces

Когда в репозитории появятся `apps/web`, `apps/field` или другой JS/TS workspace:

- первый PR с таким workspace должен добавить repo-level pin версии Node через `.nvmrc` или `.node-version`;
- package manager должен быть зафиксирован явно;
- lockfile коммитится вместе с workspace;
- нельзя опираться на глобальный `nvm default` или иной пользовательский shell setup как на policy репозитория.

### 6.3. Stage Artifacts

Если изменение делается в рамках roadmap stage:

- обновляй только те stage artifacts в `.agent/stages/<stage-id>/`, для которых у тебя есть реальное доказательство;
- не помечай feature как done без evidence;
- если slice принял новое решение или устранил расхождение с документацией, синхронизируй канонические docs в том же PR;
- не смешивай в одном PR production change и unrelated cleanup нескольких stage directories.

## 7. Pull Request

### 7.1. Заголовок PR

Заголовок PR должен совпадать по формату с коммитом:

```text
<type>[(scope)]: <summary>
```

Примеры:

- `feat(api): add agreement CRUD endpoints`
- `fix(db): prevent invalid organization relation`
- `docs: describe commit and PR rules`

Так как в репозитории используется `Squash & merge`, заголовок PR фактически становится финальным сообщением коммита в `main`.

Summary в заголовке PR тоже пиши на английском.

### 7.2. Что должно быть в PR

PR должен быть reviewer-friendly и содержать:

- краткий контекст проблемы или задачи;
- что именно изменено;
- как это проверить;
- какие есть риски, ограничения или что не было проверено;
- ссылку на тикет, stage-id или ADR, если они относятся к изменению.

Описание PR можно писать короткими русскими фразами, если оно остается точным и проверяемым.

Рекомендуемая структура описания:

```md
## Контекст
- какая проблема решается
- почему изменение нужно сейчас

## Что сделано
- ключевые изменения по сути

## Как проверить
- команды
- сценарии
- ожидаемый результат

## Риски и примечания
- ограничения
- обратная совместимость
- что осталось вне PR

## Скриншоты
- при UI-изменениях
```

### 7.3. Размер И Фокус

- PR должен быть обозримым.
- Не смешивай в одном PR несколько типов работы.
- Если задача большая, режь ее на slices, которые можно ревьюить отдельно.
- Если в PR есть generated artifacts, reviewer должен понимать, какой source-change их вызвал.

## 8. Минимальная Проверка Перед PR

### 8.1. Для backend-изменений

Если toolchain доступен локально, перед PR ожидается минимум:

- из `apps/backend`: `go test ./...`
- из `apps/backend`: `go build ./...`
- релевантная проверка миграций;
- из `apps/backend`: `make sqlc-generate`, если изменения затронули schema или queries;
- из `apps/backend`: `make swagger`, если изменения затронули API contract или swagger annotations.

Если часть проверок не запустилась из-за ограничений среды, это нужно явно написать в PR.

Пока в репозитории нет полноценного repo-level CI baseline, поэтому локально воспроизводимые команды и точное описание проверки в PR особенно важны.

### 8.2. Для docs-only изменений

- проверь, что текст не противоречит `README.md`, `docs/roadmap.md` и `docs/architecture/source-of-truth.md`;
- для workflow/architecture docs также проверь согласованность с `docs/architecture/documentation-workflow.md` и `AGENTS.md`;
- не смешивай docs cleanup с кодовыми изменениями, если это разные задачи.

### 8.3. Для будущих UI изменений

После появления UI workspace обязательны:

- install/build checks;
- lint/typecheck;
- browser smoke для затронутого сценария;
- screenshot evidence для user-facing changes;
- прохождение UI review gate по `docs/design/ui-workflow.md`.

## 9. Ревью И Мерж

- Перед merge нужен апрув коллеги.
- На комментарии ревью нужно отвечать и закрывать дискуссии по существу.
- Если замечание требует отдельной независимой переработки, лучше вынести ее в новый PR, а не раздувать текущий.
- Мержим через `Squash & merge` в `main`.
- После merge ветку нужно удалить.

## 10. Короткий Workflow

```bash
git checkout main
git pull
git checkout -b <type>/<short-kebab-case>

# работа над задачей

git add .
git commit -m "<type>(scope): description"
git push -u origin HEAD
gh pr create
```

Для текущего backend baseline это обычно означает:

1. внести изменение в `apps/backend`;
2. в `apps/backend` обновить связанные миграции / `sqlc` / Swagger, если требуется;
3. прогнать доступные проверки;
4. открыть маленький сфокусированный PR.
