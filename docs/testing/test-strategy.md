# Test Strategy

Статус: draft baseline  
Обновлено: 2026-04-18

## Назначение

Этот документ фиксирует минимальную стратегию проверки VRK MVP по этапам roadmap так, чтобы каждый stage-run оставлял доказуемый результат, а не только изменения в коде.

## Текущее исходное состояние

- в репозитории существует backend-контур в `apps/backend`;
- `apps/web` уже сочетает Storybook-first UI foundation и runnable Stage 02 runtime shell, а `apps/field` существует как PWA-first scaffold;
- в репозитории уже есть `package.json`, `pnpm-lock.yaml` и repo-level pin Node.js `v24.14.1` через `.nvmrc`, root `package.json` и root `.npmrc`;
- repo-level `pnpm` зафиксирован на `10.33.0` через root `packageManager`;
- roadmap уже использовал `Stage 01` для Storybook/UI foundation до full-stack platform stage;
- stage harness установлен и использует `.agent/stages/<stage-id>/` как durable memory;
- в текущей среде выполнения локальный `go` может отсутствовать, поэтому backend build/test path должен оставаться доступным через контейнерные scripts.

## Общие правила проверки

- каждый stage-run начинает с re-sync и smoke существующего baseline;
- evidence должно храниться в `.agent/stages/<stage-id>/evidence.*` и `raw/`;
- если slice меняет или уточняет задокументированное поведение, evidence должно фиксировать doc-sync и обновленные канонические docs;
- stage нельзя закрывать без свежего verifier-pass;
- verifier не правит production code;
- существенный documentation drift по измененному slice считается proof gap;
- если baseline smoke падает, следующий stage сначала чинит baseline, а не строит новую функциональность поверх него.

## Слои проверки

### 1. Repo and harness checks

Для Stage 00 обязательны:

- runtime self-check через `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 00-harness-and-source-of-truth`;
- проверка наличия `AGENTS.md`, `.agents/skills`, `.codex/agents`, `.codex/config.toml`;
- проверка существования `.agent/stages/00..07`;
- проверка, что source-of-truth, ADR и stage artifacts реально созданы.
- bootstrap archive используется только как historical provenance или ручной recovery path, а не как обязательный шаг runtime-проверки.

### 2. Backend checks

Начиная со Stage 01 stage-run обязан как минимум попытаться воспроизвести baseline backend smoke, если инструментальная среда это позволяет.

Начиная со Stage 02 обязательны:

- `go test ./...` локально или через container-backed path
- `go build ./...` локально или через container-backed path
- миграции up/down на локальной PostgreSQL
- API smoke на поднятом backend
- проверка актуальности Swagger/OpenAPI после изменения API

Если тесты требуют внешней базы, stage обязан поднимать локальный reproducible stack или предоставить контейнерный путь запуска.

### 3. Web and field checks

Для `apps/web` и после появления `apps/field` обязательны:

- repo-level pin Node.js `v24.14.1` должен оставаться синхронизированным между `.nvmrc`, root `package.json`, root `.npmrc` и JS/TS workspace `package.json` до первого install/build;
- явная фиксация package manager в `package.json` и коммит lockfile;
- install + build checks;
- lint/typecheck;
- browser/runtime smoke для ключевых ролей;
- для Stage 02 field contour допускается scaffold-proof без реального offline-to-online scenario, если evidence явно фиксирует, что Stage 06 offline engine еще не live;
- screenshot evidence или эквивалентные UI captures/route snapshots для user-facing flows, когда visual behavior matters;
- обязательный `$web-design-guidelines` pass для changed UI files;
- evidence с prompt/brief source и подтверждением закрытия UI findings.

### 4. Contract and workflow checks

Для стадий с бизнес-логикой обязательны:

- проверка допустимых статусных переходов;
- проверка ограничений one-contractor and one-work-type per request;
- проверка договорной маршрутизации;
- проверка, что канонические docs и диаграммы обновлены, если slice менял workflow или contract;
- проверка acceptance/reporting flows по evidence, а не только по коду.

## Минимальные stage gates

### Stage 00

- runtime self-check проходит без обращения к bootstrap installer flow;
- harness установлен;
- stage directories seeded;
- source-of-truth и ADR заморожены;
- зафиксирована test strategy;
- proof gaps и ограничения среды задокументированы.

### Stage 01

- `apps/web` существует и содержит Storybook scaffold;
- Storybook стартует или собирается воспроизводимо;
- зафиксированы design tokens, story helpers и component backlog source of truth;
- foundation / Wave 1 stories покрывают обязательные states для changed components;
- измененные UI файлы проходят `$web-design-guidelines`.

### Stage 02

- backend собирается и стартует;
- dev stack воспроизводим через root startup contract;
- появляются baseline smoke scripts и CI hooks;
- web/field scaffolds проходят build smoke;
- backend health/readiness и seeded API smoke проходят через тот же root stack.

### Stage 03-07

Каждый stage обязан определять собственный sprint contract, evidence bundle и verifier-owned verdict, но минимум всегда включает:

- позитивный flow;
- хотя бы один негативный/guardrail flow;
- обновленный evidence bundle;
- свежий verifier pass.

## Инструментальные требования

Для полноценной верификации локальная среда должна иметь:

- Go toolchain совместимой версии;
- PostgreSQL 17 или совместимый локальный runtime;
- `migrate`, `sqlc`, `swag` для backend lifecycle;
- Node.js `v24.14.1` обязателен для текущего Storybook/web baseline и всех install/build/lint/typecheck smoke checks в JS/TS workspaces;
- browser automation tooling после появления UI.

## Текущие открытые gaps

- при запуске compose stack нужно учитывать host port overrides, если локальная машина уже использует стандартные web/backend порты;
- screenshot evidence для field runtime и более глубокие offline scenarios остаются полезным follow-up, даже если Stage 02 закрывается на scaffold proof.
