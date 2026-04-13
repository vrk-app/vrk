# Source Of Truth

Статус: accepted  
Обновлено: 2026-04-12

## Назначение

Этот документ фиксирует, на какие артефакты должен опираться Codex при поэтапной реализации MVP и как разрешать конфликты между существующим кодом, PRD и более старыми описаниями.

## Приоритет источников истины

При конфликте источники применяются в таком порядке:

1. Текущее состояние репозитория:
   - `README.md`
   - `docs/PRD-MVP.md`
   - `BACKEND.md`
   - код и структура в `apps/backend/`
2. Операционный roadmap для агента:
   - `docs/roadmap.md`
   - `docs/architecture/documentation-workflow.md`
3. Архивные bootstrap и исторические материалы:
   - `docs/archive/agent-bootstrap/`

Если описание в более позднем документе противоречит уже существующему коду и структуре репозитория, приоритет у репозитория и PRD. Любое сознательное отклонение должно оформляться отдельным ADR до изменения кода.

Архивные bootstrap-материалы полезны только для восстановления harness или анализа его происхождения; они не задают текущий runtime workflow.

## Documentation drift policy

Если в ходе работы принято решение, которое меняет или уточняет уже задокументированное поведение, приоритет остается у текущего repo state и явно принятого решения, но агент обязан синхронно обновить канонические docs в том же slice. Нельзя оставлять расхождение между кодом, stage evidence и технической документацией как “потом поправим”.

Подробные правила doc-sync и требований к диаграммам заданы в `docs/architecture/documentation-workflow.md`.

## UI-specific source of truth

Для frontend/UI-задач после общего product/source-of-truth слоя агент обязан дополнительно читать:

1. `AGENTS.md`
2. `docs/design/ui-workflow.md`
3. `docs/design/serviceops-design-system.md`
4. `docs/architecture/frontend-architecture.md`
5. `.impeccable.md`

Назначение слоев:

- `AGENTS.md` фиксирует repo-level policy и обязательные workflow правила.
- `docs/design/ui-workflow.md` фиксирует канонический UI pipeline и review gate.
- `docs/design/serviceops-design-system.md` фиксирует токены, визуальные паттерны и правила reusable компонентов.
- `docs/architecture/frontend-architecture.md` фиксирует целевую layered architecture, data boundaries и frontend coding conventions для будущего `apps/web`.
- `.impeccable.md` задает общий tone и brand context для UI-генерации.

Если будущая shared UI-библиотека или `apps/web` вводят реализованные primitives, их фактическое API имеет приоритет над более старой дизайн-докой до синхронного обновления документации.

## Что уже зафиксировано репозиторием

- Реальный backend уже существует в `apps/backend/` и реализуется на Go.
- API собирается как REST-сервис на `chi`; OpenAPI/Swagger уже генерируется в `apps/backend/docs/swagger/`.
- Данные хранятся в PostgreSQL; миграции лежат в `apps/backend/migrations/`.
- Stage 01 уже добавил `apps/web` как Storybook-first UI foundation с foundations, Wave 1 shell/auth/request-list slices и showcase stories; `apps/field` по-прежнему отсутствует и остается следующим этапом roadmap.
- Repo-level Node/pnpm policy теперь зафиксирована через `.nvmrc`, `package.json`, `pnpm-workspace.yaml` и `pnpm-lock.yaml`.
- Конфигурация backend строится через `.env` и `apps/backend/.env.example`.

## Разрешение текущих неоднозначностей

### Backend vector

Канонический вектор реализации для MVP: Go modular monolith. Любые альтернативы вроде Django rewrite, Java-first backend или полного пересбора архитектуры считаются вне текущего направления, пока отдельный ADR не утверждает иное.

### Product scope

Канонический бизнес-фокус: заявка как центральный объект, один подрядчик на заявку, один вид работ на заявку, несколько единиц оборудования на заявку, смета только для внеплановых работ, приемка внутри системы без КЭП.

### Status model

`docs/PRD-MVP.md` фиксирует целевую MVP-модель статусов заявки. Текущие seed-данные в backend пока содержат упрощенную техническую рамку и должны считаться временным implementation baseline, а не окончательной бизнес-моделью.

### Offline model

Для MVP принят `PWA-first` подход с локальными черновиками и ручной синхронизацией после восстановления связи. Полноценный распределенный conflict-resolution engine в Stage 00 не проектируется.

## Операционные артефакты long-running разработки

Следующие файлы и каталоги являются обязательной долговременной памятью для последующих stage-runs:

- `AGENTS.md`
- `docs/architecture/documentation-workflow.md`
- `docs/design/ui-workflow.md`
- `docs/design/serviceops-design-system.md`
- `docs/architecture/frontend-architecture.md`
- `.agents/skills/vrk-mvp-stage-orchestrator/`
- `.codex/agents/`
- `.codex/config.toml`
- `.agent/stages/<stage-id>/`

Для каждого нового stage-run Codex должен сначала читать эти артефакты, затем уже переходить к коду и новым изменениям.

## Что считать legacy-источником

`BACKEND.md` и часть формулировок в `README.md` содержат более широкий желаемый охват, чем текущий код. Их нужно использовать как доменное объяснение и источник требований, но не как разрешение расширять MVP за пределы `docs/PRD-MVP.md` и `docs/roadmap.md`.

## Практическое правило для следующих этапов

Перед любой крупной реализацией:

1. сверить текущий stage с `docs/roadmap.md`;
2. сверить бизнес-ограничения с `docs/PRD-MVP.md`;
3. сверить существующий код и миграции в репозитории;
4. если возникает конфликт или развилка, сначала обновить ADR, потом код.
