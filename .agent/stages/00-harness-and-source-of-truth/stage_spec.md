# Stage Spec

- Stage ID: 00-harness-and-source-of-truth
- Stage Name: Harness and source of truth

## Objective

Подготовить репозиторий к поэтапной автономной работе Codex: установить repo-local harness, зафиксировать source-of-truth и ADR, создать долговременные stage artifacts и определить базовую test strategy до начала продуктовых стадий.

## In scope

- установить и активировать repo-local harness (`.agents/skills`, `.codex/agents`, `.codex/config.toml`, `AGENTS.md`);
- создать и засеять `.agent/stages/00..07`;
- зафиксировать `docs/architecture/source-of-truth.md`;
- зафиксировать ADR по стеку, scope guardrails, статусной модели заявки и offline sync;
- зафиксировать `docs/testing/test-strategy.md`;
- встроить Storybook/UI source backlog в repo-local workflow;
- собрать evidence по bootstrap и текущим инфраструктурным ограничениям среды.

## Out of scope

- реализация продуктовых фич Stage 01+;
- переписывание backend или смена технологического стека;
- миграция таблиц/статусов заявок;
- поднятие полноценного dev stack и runtime smoke при отсутствии toolchain;
- закрытие Stage 00 без свежего verifier-pass.

## Source documents

- docs/roadmap.md
- AGENTS.md
- README.md
- docs/PRD-MVP.md
- BACKEND.md
- .agent/stages/00-harness-and-source-of-truth/progress.md
- .agent/stages/00-harness-and-source-of-truth/feature_list.json

## Acceptance criteria

- `AGENTS.md`, `.agents/skills/vrk-mvp-stage-orchestrator/`, `.codex/agents/` и `.codex/config.toml` существуют и согласованы с harness.
- `.agent/stages/00-harness-and-source-of-truth` и `.agent/stages/01..07` существуют.
- `docs/architecture/source-of-truth.md` разрешает конфликт между repo state, PRD и legacy-описаниями.
- ADR по стеку, MVP scope, status model и offline sync созданы.
- `docs/testing/test-strategy.md` создан и фиксирует текущие proof gaps среды.
- `docs/design/storybook-component-backlog.md` существует и встроен в UI workflow / AGENTS guidance.
- Для Stage 00 собран evidence bundle; stage не считается закрытым без свежего verifier-pass.

## Technical ownership / paths

- `AGENTS.md`
- `.agents/skills/vrk-mvp-stage-orchestrator/`
- `.codex/agents/`
- `.codex/config.toml`
- `.agent/stages/`
- `docs/architecture/`
- `docs/testing/`

## Risks

- в текущей среде отсутствует `go`, поэтому backend build/test smoke не доказан;
- исторический дубликат `roadmap_mvp.md` удален, а операционный источник истины для агента теперь находится в `docs/roadmap.md`;
- текущий seed статусов в backend расходится с целевой моделью из PRD и должен быть нормализован на последующих стадиях;
- без отдельного свежего verifier-pass Stage 00 нельзя формально закрыть.

## Verification plan

- при необходимости сверить archived bootstrap bundle в `docs/archive/agent-bootstrap/`;
- проверить наличие всех stage directories через `find .agent/stages`;
- проверить наличие и содержательное заполнение docs/architecture и docs/testing;
- зафиксировать попытку backend smoke (`go test`, `go build`) и документировать блокировку среды;
- подготовить evidence bundle и оставить verdict в `PENDING` до отдельного verifier-pass.
