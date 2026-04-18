# Stage Spec

- Stage ID: 02-platform-foundation
- Stage Name: Platform foundation

## Objective

Поднять platform foundation для runtime-контуров и перевести `apps/web` от Storybook-only Stage 01 baseline к **product-shaped web runtime shell**, ориентированному на customer-admin bootstrap flow, не смешивая Stage 03 domain activation в Stage 02.

## In scope

- bootstrapping `apps/web` runtime поверх Stage 01 foundation;
- route shells для:
  - login;
  - registration;
  - company onboarding / profile;
  - equipment contour;
  - contracts contour;
  - truthful gated request placeholder;
- shared API client layer, route-local adapters и form/view-model boundaries;
- mock / seed / stub data boundaries там, где реальные Stage 03 контракты еще не живут;
- env contract, dev startup scripts, backend OpenAPI stabilization, seeds/demo fixtures;
- `apps/field` scaffold, CI hooks, structured logs и health baseline;
- canonical doc sync для flow interpretation и stage boundaries.

## Out of scope

- real auth / logout / refresh / role-aware access beyond baseline bootstrap;
- persisted org / branch / equipment / contract CRUD;
- contractor invitation state machine с реальными статусами;
- request create flow и request detail contour;
- contractor execution, materials, TO/MO schedule approval loops;
- modernization / supply branches из imported Draw.io, которые выходят за текущий MVP scope;
- объявление stage done без evidence bundle и fresh verifier pass.

## Source documents

- docs/roadmap.md
- AGENTS.md
- docs/PRD-MVP.md
- docs/architecture/frontend-architecture.md
- docs/design/customer-admin-bootstrap-flow.md
- docs/design/diagrams/customer-admin-bootstrap-flow.drawio
- progress.md
- feature_list.json

## Frozen phasing inside Stage 02

- Полный `Stage 02` по-прежнему обязан закрыть platform baseline: backend health, root dev/startup path, CI/smoke automation и `apps/field` scaffold.
- `slice-001-web-runtime-auth-onboarding-shell` уже доказал первый runnable web runtime shell поверх Stage 01 foundation.
- Для `slice-001` публичный runtime route set был заморожен так:
  - `/login`
  - `/register`
  - `/company`
  - `/equipment`
  - `/contracts`
  - `/requests` только как truthful gated placeholder до `Stage 04`
- `slice-001` обязан был показать явные API/auth bootstrap boundaries, но не обязан был доказывать реальный auth/session contract, backend health endpoint, root `make dev`, CI workflow или `apps/field`.
- Текущий ближайший sprint contract `slice-002-platform-baseline-health-ci-field` закрывает оставшийся platform tail:
  - root `make dev` / `make smoke` или эквивалентный reproducible startup path;
  - backend health/readiness baseline и structured runtime logs;
  - `apps/field` как PWA-first scaffold без преждевременного Stage 06 offline engine;
  - CI hook для repo-level lint/test/build/smoke;
  - seeded backend smoke через поднятый runtime stack.
- До `slice-002` backend для web runtime считался truthful bootstrap source только в пределах Swagger / seed / stub / read-oriented contract assumptions; после `slice-002` stage должен оставить стабильный platform floor для Stage 03/04.

## Acceptance criteria

- `apps/web` runtime существует и воспроизводимо стартует поверх Stage 01 foundation.
- Auth/register/onboarding/equipment/contracts route shells существуют и переиспользуют Stage 01 shared UI foundation.
- Runtime shell не притворяется Stage 03: mock / seed / stub boundaries явные, а недоступные contours отражены truthfully.
- Request contour не выдается за живой продуктовый path до Stage 04; допустим только gated / placeholder state.
- `make dev` / аналог поднимает backend, web runtime и field scaffold; health endpoint доступен.
- CI воспроизводимо гоняет lint/test/build/smoke.
- Канонические docs, `feature_list.json`, `progress.md`, `evidence.*` и `verdict.json` поддерживаются в актуальном состоянии.

## Technical ownership / paths

- `apps/web/`
- `apps/field/`
- `apps/backend/`
- `docs/design/customer-admin-bootstrap-flow.md`
- `docs/design/diagrams/customer-admin-bootstrap-flow.drawio`
- `docs/architecture/frontend-architecture.md`
- `.agent/stages/02-platform-foundation/`

## Risks

- stage легко раздуть до Stage 03, если route shells начнут тащить реальную master-data persistence;
- imported Draw.io смешивает несколько будущих stage-ов и содержит ветки вне текущего MVP scope;
- фиктивно “рабочие” controls и tabs могут дать ложное proof impression, если не держать truthful placeholders;
- параллельное поднятие web runtime, field contour и infra baseline может размазать первый sprint contract;
- если flow boundary не закрепить в docs сразу, Stage 02 может разойтись между roadmap, web runtime и stage artifacts.

## Verification plan

- запустить reproducible dev/build/smoke path для backend, web runtime и field scaffold;
- доказать navigable runtime shell для login/register/onboarding/equipment/contracts routes;
- собрать evidence: route walk, screenshots или equivalent UI refs, health checks, build/test outputs;
- перечислить changed docs, diagram refs и data-boundary assumptions в `evidence.*`;
- обновить `feature_list.json`, `progress.md`, `evidence.md`, `evidence.json`;
- не закрывать stage без fresh verifier pass.

Для `slice-002` proof floor заморожен так:

- reproducible root startup path поднимает `db`, backend, `apps/web` runtime и `apps/field` scaffold;
- backend отвечает на `health` / `ready` checks и оставляет structured logs;
- seeded API smoke доказывает, что миграции и demo fixture доступны внутри поднятого stack;
- CI hook повторяет lint/test/build/smoke expectations для Stage 02 baseline;
- canonical docs и downstream stage artifacts отражают, что platform tail больше не остается open blocker.
