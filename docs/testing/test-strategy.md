# Test Strategy

Статус: draft baseline  
Обновлено: 2026-04-12

## Назначение

Этот документ фиксирует минимальную стратегию проверки VRK MVP по этапам roadmap так, чтобы каждый stage-run оставлял доказуемый результат, а не только изменения в коде.

## Текущее исходное состояние

- в репозитории существует только backend-контур в `apps/backend`;
- `apps/web` и `apps/field` еще не созданы;
- в репозитории нет `package.json`, lockfile и repo-level pin версии Node.js;
- roadmap резервирует `Stage 01` под Storybook/UI foundation до full-stack platform stage;
- stage harness установлен и использует `.agent/stages/<stage-id>/` как durable memory;
- в текущей среде выполнения отсутствует `go`, поэтому compile/smoke backend прямо сейчас не выполняются.

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

- `go test ./...`
- `go build ./...`
- миграции up/down на локальной PostgreSQL
- API smoke на поднятом backend
- проверка актуальности Swagger/OpenAPI после изменения API

Если тесты требуют внешней базы, stage обязан поднимать локальный reproducible stack или предоставить контейнерный путь запуска.

### 3. Web and field checks

После появления `apps/web` и `apps/field` обязательны:

- repo-level pin Node.js через `.nvmrc` или `.node-version` до первого install/build;
- явная фиксация package manager в `package.json` и коммит lockfile;
- install + build checks;
- lint/typecheck;
- browser smoke для ключевых ролей;
- offline-to-online scenario для field-клиента;
- screenshot evidence для user-facing flows.
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
- dev stack воспроизводим;
- появляются baseline smoke scripts и CI hooks;
- web/field scaffolds проходят build smoke.

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
- Node.js toolchain не требуется для текущего baseline, но обязателен после появления web/field-контуров вместе с repo-level pin версии и lockfile;
- browser automation tooling после появления UI.

## Текущие открытые gaps

- `go` отсутствует в текущей среде, поэтому backend build/test smoke не доказан.
- В репозитории пока нет health endpoint или smoke entrypoint верхнего уровня.
- Нет CI, который бы автоматически проверял roadmap gates.
