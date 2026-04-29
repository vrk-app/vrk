# Roadmap

## Назначение

Этот roadmap предназначен не для классической ручной разработки, а для **поэтапного автономного исполнения в Codex**.  
Каждый этап запускается как **отдельный top-level Codex agent run**, который:

1. читает roadmap, PRD, README, BACKEND.md и stage-артефакты;
2. замораживает спецификацию именно для своего этапа;
3. оркестрирует bounded subagents;
4. реализует один feature slice за раз;
5. собирает evidence;
6. синхронизирует каноническую документацию и диаграммы по принятым решениям;
7. запускает **fresh verifier**;
8. делает минимальный safe fix-cycle до `PASS`;
9. оставляет чистый handoff для следующей сессии и следующего этапа.

---

## Базовые решения для agent-first разработки

### 1. Приоритет источников истины

Для автономной реализации источники истины должны применяться в таком порядке:

1. **Текущее состояние репозитория** (`README.md`, `docs/PRD-MVP.md`, `BACKEND.md`, существующая структура `apps/backend/...`)
2. **Текущее MVP-видение продукта** из PRD
3. **Исходное ТЗ** как legacy business source, если оно не противоречит репозиторию

### 2. Архитектурная фиксация для Codex

Чтобы не разрушать текущий кодовый вектор, roadmap исходит из следующего:

- **backend**: Go modular monolith
- **API**: REST + OpenAPI
- **database**: PostgreSQL
- **cache/queue-ready**: Redis-ready, async hooks optional
- **web**: Next.js + TypeScript
- **field engineer client**: PWA-first mobile contour for MVP
- **artifact storage**: S3-compatible abstraction
- **orchestration model**: one stage orchestrator + bounded leaf subagents

### 3. Обязательные правила исполнения

- Один top-level agent run = один roadmap stage.
- Один implementation slice = один sprint contract.
- Stage orchestrator всегда является **единственным владельцем stage state**.
- Builder является **единственным владельцем integration branch logic** и evidence bundle.
- Fresh verifier **никогда** не переиспользуется как previous verifier session.
- Subagent tree держим **shallow**: root orchestrator -> leaf subagents.
- Recursive orchestration leaf-агентами запрещена.
- Существенный documentation drift по измененному slice считается proof gap.
- Если решение меняет канонически задокументированное поведение или архитектуру, docs обновляются в том же slice, а не откладываются молча.
- Нельзя объявлять этап завершенным, пока:
  - все stage acceptance criteria не доказаны,
  - `feature_list.json` по этапу не имеет незакрытых обязательных пунктов,
  - последний verifier не вернул `PASS`.

### 4. Общий stage artifact contract

Для каждого этапа создается папка:

`.agent/stages/<stage-id>/`

Минимальный состав:

- `stage_spec.md`
- `feature_list.json`
- `progress.md`
- `sprint_contract.md`
- `evidence.md`
- `evidence.json`
- `verdict.json`
- `problems.md`
- `raw/`

### 5. Общий шаблон orchestration для каждого этапа

1. **Re-sync**
   - прочитать `AGENTS.md`
   - прочитать `docs/architecture/documentation-workflow.md`
   - прочитать roadmap stage section
   - прочитать `progress.md`, `feature_list.json`, `git log`
   - поднять app/dev stack
   - прогнать smoke before-change

2. **Spec freeze**
   - при необходимости: до 3 read-only explorers
   - один spec-freezer пишет/обновляет `stage_spec.md`
   - формируется `feature_list.json`
   - формируется `sprint_contract.md` для ближайшего slice

3. **Build**
   - один integration builder владеет основным изменением
   - optional: до 3 worker children c явным file/module ownership
   - builder не делегирует orchestration вниз
   - builder обязан синхронизировать канонические docs, если в slice меняется или уточняется зафиксированное решение

4. **Evidence**
   - builder пакует evidence
   - raw outputs, screenshots, logs, query traces, curl traces, test outputs сохраняются в `raw/`

5. **Doc-sync**
   - обновляются канонические docs по измененному behavior / architecture / workflow / contract
   - для нетривиальных flows и state machines добавляются или обновляются диаграммы
   - `evidence.*` перечисляет doc updates и diagram refs

6. **Verify**
   - один fresh verifier
   - verifier не меняет production code
   - verifier пишет `verdict.json`
   - verifier считает существенный documentation drift proof gap
   - если не PASS: пишет `problems.md`

7. **Fix**
   - один fixer применяет smallest safe change set
   - builder/parent обновляет docs и evidence, если это требуется для закрытия proof gap
   - запускается новый fresh verifier

8. **Close / continue**
   - `progress.md` обновлен
   - `feature_list.json` отражает только реально доказанные пункты
   - канонические docs отражают принятые решения текущего slice
   - сделан осмысленный git commit
   - если stage DoD не достигнут — начинается новый slice

---

## Scope guardrails для MVP

### Входит в этот roadmap

- веб-кабинет заказчика
- веб-кабинет подрядчика
- инженерный мобильный контур с offline-first UX
- invite-based активация первого администратора организации
- иерархия `организация -> дивизион -> юнит` с scoped access
- заявка как центральный объект
- три типа работ: ремонт / ТО / поверка
- один подрядчик на заявку
- один вид работ на заявку
- несколько единиц оборудования в одной заявке
- реестры `оборудование -> СИ -> эталоны` и журналы метрологических операций как часть master-data contour
- договорная маршрутизация
- отдельный контур сметы для внеплановых работ
- приемка результата внутри системы
- базовый учет материалов
- архивирование ключевых сущностей вместо hard delete
- contractor-facing документы и отчетность
- базовая аналитика и release hardening

### Не входит в этот roadmap MVP

- юридически значимая ЭП / КЭП
- самостоятельный отраслевой метрологический модуль вне встроенных реестров и журналов
- тендер между несколькими подрядчиками
- несколько подрядчиков внутри одной заявки
- несколько видов работ в одной заявке
- full ERP/EAM replacement
- Bitrix24 как обязательный контур
- AI-прогнозирование как обязательный модуль
- корпоративный сайт и биллинг/продажа лицензий в этом же репозитории

---

## Этапы

## Stage 00 — `00-harness-and-source-of-truth`

### Цель

Подготовить репозиторий к long-running autonomous Codex work так, чтобы дальнейшие этапы шли не «по памяти модели», а через структурированные stage artifacts, устойчивый handoff и repo-local guidance.

### Основные результаты

- repo-root `AGENTS.md`
- установлен skill `.agents/skills/vrk-mvp-stage-orchestrator/`
- установлены project-scoped subagents в `.codex/agents/`
- создан `.codex/config.toml` или согласованный config snippet
- создана структура `.agent/stages/`
- зафиксирован документ `docs/architecture/source-of-truth.md`
- зафиксированы ADR:
  - стек backend/web/mobile
  - scope MVP / out-of-scope
  - status model заявки
  - подход к offline sync
- создан `docs/testing/test-strategy.md`

### Что делает stage orchestrator

- сравнивает legacy ТЗ с текущим repo state
- фиксирует, что текущий вектор реализации — Go backend, а не Django rewrite
- формирует initial feature registry по этапам
- раскладывает roadmap по stage directories

### Предпочтительный subagent plan

- explorers:
  - domain-reconciliation explorer
  - repo-structure explorer
  - workflow explorer
- spec-freezer: 1
- builder: 1
- verifier: 1 fresh

### Exit gate

- все последующие этапы можно запускать без дополнительного человеческого объяснения
- stage artifacts существуют
- source-of-truth и ADR-файлы покрывают ключевые product/tech ambiguities
- skill реально подключен к repo workflow

---

## Stage 01 — `01-ui-storybook-foundation`

### Цель

Создать Storybook-first UI foundation для VRK до продуктовой full-stack сборки: зафиксировать source backlog компонентов, поднять `apps/web` и Storybook, codify design tokens и реализовать foundations + Wave 1 для дальнейших business stages.

### Основные результаты

- `apps/web` scaffolded
- Storybook установлен и запускается как repo-local UI harness
- `docs/design/storybook-component-backlog.md` зафиксирован как source backlog для component-library work
- design-token bridge между `docs/design/serviceops-design-system.md` и кодом
- shared story helpers:
  - enums
  - mock data
  - reusable story decorators / layout wrappers
- foundations:
  - TokenDocs
  - IconGallery
- Wave 1 UI foundation:
  - базовые UI primitives
  - layout/navigation primitives
  - auth baseline components
  - request-list baseline components
- минимум один sprint contract сформирован так, чтобы дальнейшие UI slices шли через Storybook и evidence bundle

### Что должно появиться в коде

- `apps/web` app scaffold и Storybook config
- токены, theme utilities и story helper fixtures
- component API conventions, согласованные с design system и Storybook backlog
- foundations и Wave 1 stories с обязательными state variants
- app-shell/auth/request-list showcase baseline
- reproducible UI commands, которые агент может reliably запускать в каждой новой сессии

### Предпочтительный subagent plan

- explorers:
  - Storybook/tooling explorer
  - design-token/backlog explorer
  - component API explorer
- spec-freezer: 1
- builder: 1 integration owner
- workers (optional):
  - Storybook scaffold worker
  - foundation primitives worker
  - shell/auth/request-list worker
- verifier: 1 fresh

### Exit gate

- `apps/web` и Storybook стартуют воспроизводимо
- `docs/design/storybook-component-backlog.md` является source backlog для Storybook/component work
- foundations и Wave 1 реализованы в Storybook с обязательными states
- auth/request-list baseline доказаны через showcase stories и evidence
- changed UI files проходят mandatory UI review gate

---

## Stage 02 — `02-platform-foundation`

### Цель

Довести репозиторий до состояния полноценной full-stack MVP basis поверх Stage 01 UI foundation и поднять `apps/web` от Storybook-only baseline к **product-shaped runtime shell**: backend, web runtime, engineer client contour, dev stack, CI hooks, seeds и smoke tests без преждевременного смешивания Stage 03 domain-логики в Stage 02.

### Основные результаты

- `apps/web` runtime bootstrapped поверх Stage 01 component foundation
- в runtime зафиксирован и собран route-level shell для customer-admin bootstrap flow:
  - login
  - registration
  - company onboarding / profile
  - equipment contour с empty/add/import shells
  - contracts contour с create / contractor-invite shells
  - truthful gated placeholder для request contour до Stage 04
- `apps/field` или PWA-first mobile contour scaffolded
- единый env contract
- docker/dev startup scripts
- backend OpenAPI flow стабилизирован
- test data seed / demo fixture
- CI pipeline для lint/test/build/smoke
- наблюдаемость baseline:
  - structured logs
  - health endpoints
- truthful auth/session boundaries для web + field clients

### Что должно появиться в коде

- repo conventions для frontend и field contour
- route groups/pages для auth, company onboarding, equipment и contracts contour
- shared API client layer
- route-level form schemas, adapters и view-model boundaries для runtime shell
- mock / seed / stub data boundaries там, где Stage 03 контракты еще не активированы
- web runtime, собранный на Stage 01 shell/components
- truthful gating/placeholder states для еще не включенного request contour
- auth/session boundary surfaces
- app boot scripts, которые агент может reliably запускать в каждой новой сессии

### Предпочтительный subagent plan

- explorers:
  - frontend scaffold explorer
  - backend dev-run explorer
  - CI/test harness explorer
- spec-freezer: 1
- builder: 1 integration owner
- workers (optional):
  - web runtime worker
  - field scaffold worker
  - CI script worker
- verifier: 1 fresh

### Exit gate

- `make dev` / аналог стартует воспроизводимо
- backend, web runtime и field contour поднимаются локально
- есть smoke path:
  - open app
  - login/register screen visible
  - company onboarding / equipment / contracts shells navigable
  - request contour shown truthfully as gated or placeholder until Stage 04
  - health endpoint ok
- Storybook и app runtime используют одну и ту же UI foundation
- CI workflow существует и wired к Stage 02 lint/test/build/smoke contract; remote GitHub Actions reproduction должна подтверждаться отдельным run-proof

---

## Stage 03 — `03-identity-master-data`

### Цель

Реализовать invite-based identity, scoped access и базовый контур master data, на котором стоит весь MVP: активация первого администратора, постоянный UI управления организацией/дивизионами/юнитами, сотрудники и приглашения, договоры, оборудование, СИ и эталоны.

### Основные результаты

- activation flow:
  - платформенный админ создает заготовку организации и отправляет first-admin invite по email
  - первый администратор принимает одноразовое приглашение, задает пароль и попадает в рабочий `/company` contour организации
  - первичная пустая или частично заполненная организация не блокируется отдельным wizard: настройка оргструктуры выполняется через тот же постоянный UI, которым администратор пользуется позже
  - повторная активация тем же invite token отклоняется и не создает второй session/membership baseline
  - ручная раздача паролей не используется как основной сценарий
- auth flow:
  - login
  - logout
  - refresh/session restore
  - role-aware access
- org model:
  - customer / contractor organizations
  - organization profile с разделением на launch-critical и optional requisites; поле `Тип` в профиле хранит ОПФ `ООО` / `ПАО` / `НАО` / `ИП`, а legacy `АО -> НАО`, `ЗАО -> НАО`, `ОАО -> ПАО`, `LLC -> ООО` принимаются только как compatibility input и нормализуются
  - логотип организации хранится в приватном S3-compatible object storage, а Postgres хранит только object key и metadata
  - реквизиты валидируются по цифрам: `ИНН` 10 для юрлиц и 12 для `ИП`, `КПП` 9 только для юрлиц, `ОГРН` 13 / `ОГРНИП` 15, счета 20, `БИК` 9
  - divisions без пользовательского selector-а типа; storage compatibility type остается скрытым internal default
  - units как primary operational scope для оборудования с selector-ом типа `ВРД` / `ВРЗ` / `ВУ` / `ВРП`
  - persistent organization-structure management UI для создания первого и последующих дивизионов и юнитов в любое время
  - profile actions доступны только organization-scope admin; `division_admin` управляет своим дивизионом и дочерними юнитами, `unit_admin` управляет своим юнитом
- people and access model:
  - user account, organization membership и scoped grants разделены
  - grant scope: organization / division / unit
  - canonical role templates: `organization_admin`, `organization_head`, `division_admin`, `division_head`, `division_operator`, `unit_admin`, `unit_head`, `unit_operator`, `auditor`
  - role/scope compatibility enforced: organization roles only on organization scope, division roles only on division scope, unit roles only on unit scope, `auditor` on any scope
  - Stage 03 v1 mutate capabilities есть у `organization_admin`, `division_admin` и `unit_admin`, но каждый scoped admin ограничен своим visible scope/subtree
  - employee invitation statuses: draft / sent / opened / accepted / expired / revoked
- contractor/customer relation layer
- contracts registry
- contract status baseline `inactive / active / expired` для customer-admin contour
- equipment registry
- measuring instruments registry
- standards registry
- metrology operation journals, URL/reference attachment baseline и derived status for MI / standards
- bounded ownership-scope labels for standards; standalone org-scoped dictionary/local-draft CRUD остается вне proven Stage 03 contract
- archive baseline для организаций, дивизионов, юнитов, пользователей, договоров, оборудования, СИ и эталонов
- audit baseline для auth + CRUD changes
- web UI:
  - route contour `/register -> /register/{token} -> /company`
  - company profile screens и постоянный organization-structure management surface без обязательного первичного wizard
  - division / unit selectors и scoped singular-session landing без multi-workspace picker
  - people, memberships, invites и access grant screens
  - contracts lists, cards and routing surfaces на публичном `/contracts` contour
  - equipment / measuring instrument / standard lists and cards на одном публичном `/equipment` contour с query-backed tabs и explicit archive visibility state

### Что обязательно доказать

- company onboarding shell из Stage 02 backed реальной org/division/unit моделью и превращен в постоянный management surface
- анонимный `/company` shell из Stage 02 сохраняется как truthful public contour до появления сессии
- first-admin activation начинается по invite link, а не с заранее выданного логина/пароля
- после invite acceptance пользователь получает session и попадает в `/company`, где видит состояние организации и доступные действия по управлению профилем, дивизионами и юнитами
- администратор может создать первый и последующие дивизионы и юниты из постоянного `/company` UI, а не только во время первичного запуска
- юнит может существовать напрямую под организацией без обязательного промежуточного дивизиона
- создание scoped employee invite не зависит от "завершенного wizard"; organization-scope invite доступен active organization admin, а division/unit-scope invite требует существующий visible target scope
- user account, membership и scoped grants существуют как отдельные сущности
- права уровня organization наследуются вниз на division и unit; права division наследуются на дочерние unit; deny-layer в MVP отсутствует
- пользователь после принятия приглашения видит только свой контур доступа
- invitation lifecycle и статусы видны администратору и доказаны end-to-end
- login/session restore возвращает contour, привязанный к explicit active membership/grant: customer contour на `/company`, active contractor contour на `/contracts`
- direct login с несколькими eligible memberships/grants truthfully возвращает `409`, а не silently выбирает один workspace
- `/platform/organization-shells` и Stage 03 `organizations` admin surface не доступны анонимно и не раскрывают deployment-scoped admin credential в browser
- нельзя создать рабочий request flow без зарегистрированного оборудования
- оборудование, СИ и эталоны существуют как отдельные сущности, а не как одна mega-form
- `/equipment` остается canonical public contour для equipment/master-data surface, а narrower scopes видят только read-only разрешенный subtree
- текущий метрологический статус и ближайшая дата для СИ/эталонов рассчитываются из последней применимой записи журнала, а не только из denormalized полей карточки
- эталон остается самостоятельным реестром и может использоваться повторно, без жесткой связи `1:1` с одним СИ
- договор ограничивает допустимого подрядчика, а routing eligibility считается только для `active` + in-window contract
- archive применяется вместо physical delete для ключевых master-data сущностей, archived rows скрыты из default active lists и открываются только через explicit archive state
- база ролей и организаций масштабируется под multi-org model

### Предпочтительный subagent plan

- explorers:
  - auth/access explorer
  - org-hierarchy explorer
  - contracts/assets explorer
- spec-freezer: 1
- builder: 1
- workers (optional):
  - auth/invite worker
  - access-control worker
  - master-data worker
- verifier: 1 fresh

### Exit gate

- customer admin активируется по invite и управляет организацией, дивизионами и юнитами из постоянного `/company` UI, включая first-empty state и повторное добавление структурных узлов
- сотрудники приглашаются по email и получают только scoped access своего уровня
- contracts + equipment + measuring instruments + standards CRUD, journal и archive flows работают end-to-end
- contractor user видит только свой релевантный контур в рамках договоров и выданных грантов
- audit trail фиксирует критичные действия
- seeded demo data пригодны для Stage 04

---

## Stage 04 — `04-request-core-and-customer-cabinet`

### Цель

Реализовать центральный объект продукта — заявку — и customer-side web contour для создания, маршрутизации и отслеживания заявки.

### Основные результаты

- request domain:
  - request number
  - one work type
  - one contractor
  - one-or-more equipment items
  - selected unit scope from Stage 03 master data
  - statuses baseline
- contract-based routing
- comments / discussion thread
- attachments
- timeline / audit events
- customer web cabinet:
  - request list
  - filters
  - request create flow
  - request detail view
- notifications baseline:
  - in-app
  - email-ready hooks

### Обязательные бизнес-правила

- заявка не существует без оборудования
- заявка создается в контексте выбранного юнита и использует master data из Stage 03
- один вид работ на одну заявку
- один подрядчик на одну заявку
- статусная модель не смешивает customer и contractor responsibilities
- route определяется договорным контекстом, а не ручным free-form выбором

### Предпочтительный subagent plan

- explorers:
  - request workflow explorer
  - customer UI explorer
  - notification/audit explorer
- spec-freezer: 1
- builder: 1 integration owner
- workers (optional):
  - backend request worker
  - customer UI worker
  - timeline/notification worker
- verifier: 1 fresh

### Exit gate

- customer создает заявку из UI
- contractor определяется по договору
- request появляется в системном контуре подрядчика
- customer видит timeline, вложения, комментарии и текущий статус
- verifier проходит seeded scenario end-to-end

---

## Stage 05 — `05-contractor-execution`

### Цель

Закрыть contractor-side операционный контур: получение заявки, назначение исполнителя, чек-листы, смета, материалы, документы и перевод результата в контур приемки.

### Основные результаты

- contractor cabinet:
  - request intake
  - assignment
  - queue/status board
- brigades / executors baseline
- process templates by work type
- checklist engine
- estimate / cost approval object
- basic material accounting
- contractor document pipeline:
  - act/report placeholders
  - closing document data assembly
- contractor comments and evidence flow

### Обязательные сценарии

- подрядчик берет заявку в работу
- назначает инженера/бригаду
- по внеплановой работе отправляет смету на согласование
- фиксирует материалы
- переводит заявку в состояние completed by contractor
- customer видит результат и состав доказательств

### Предпочтительный subagent plan

- explorers:
  - contractor workflow explorer
  - checklist/estimate explorer
  - material/document explorer
- spec-freezer: 1
- builder: 1
- workers (optional):
  - contractor UI worker
  - checklist/estimate worker
  - materials/docs worker
- verifier: 1 fresh

### Exit gate

- contractor end-to-end path доказан
- request может пройти through execution contour
- estimate approval работает для внеплановых работ
- materials и documents видны в request context
- stage artifacts содержат реальное evidence по contractor path

---

## Stage 06 — `06-field-engineer-offline`

### Цель

Реализовать инженерный мобильный контур с offline-first поведением, чтобы полевой исполнитель мог работать без стабильного интернета и безопасно синхронизировать данные.

### Основные результаты

- assigned task list for engineer
- task detail with checklist
- local draft persistence
- offline capture:
  - checklist answers
  - comments
  - photo attachments
  - measurements / timestamps
- sync engine
- basic conflict handling
- upload retry logic
- status/proof propagation обратно в основной request flow

### Архитектурные принципы

- сначала доказать офлайн-черновик и ручную синхронизацию
- не делать «магическую» conflict resolution без доказуемых правил
- минимально обязательные поля могут включаться поэтапно
- mobile contour не должен ломать основной web request flow

### Предпочтительный subagent plan

- explorers:
  - field UX explorer
  - offline storage explorer
  - sync contract explorer
- spec-freezer: 1
- builder: 1 integration owner
- workers (optional):
  - field UI worker
  - offline/sync worker
- verifier: 1 fresh

### Exit gate

- инженер получает назначенную заявку
- может заполнить checklist offline
- после восстановления связи данные синхронизируются
- request detail в web отражает синхронизированные полевые факты
- verifier проходит offline-to-online scenario

---

## Stage 07 — `07-acceptance-reporting-hardening-release`

### Цель

Довести систему до pilot-ready MVP: приемка, базовая аналитика, экспорт, безопасность, производительность, observability и выпуск.

### Основные результаты

- customer acceptance flow
- basic dashboards / reporting baseline:
  - statuses
  - lead times
  - overdue visibility
  - contractor execution visibility
- export baseline (CSV/XLSX/PDF-ready where justified)
- security hardening:
  - auth abuse controls
  - input validation
  - audit completeness
  - secret/env hygiene
- performance hardening:
  - list/filter/search baselines
  - N+1 elimination
  - pagination/indexing
- release readiness:
  - demo seed
  - smoke suite
  - regression suite
  - backup/restore docs
  - runbook
  - pilot checklist

### Что обязательно доказать

- customer может принять результат внутри системы
- contractor может сформировать финальный пакет по заявке
- аналитика дает управленческую видимость по MVP-метрикам
- основные страницы укладываются в целевые SLA на seeded dataset
- система воспроизводимо разворачивается и запускается для пилота

### Предпочтительный subagent plan

- explorers:
  - acceptance/reporting explorer
  - performance explorer
  - release-readiness explorer
- spec-freezer: 1
- builder: 1
- workers (optional):
  - reporting/export worker
  - performance hardening worker
  - release docs worker
- verifier: 1 fresh

### Exit gate

- pilot-ready build существует
- smoke/regression/proof bundle актуальны
- release runbook и demo setup complete
- roadmap MVP formally completed

---

## Definition of Done для всего roadmap

Roadmap считается выполненным только если соблюдены **все** пункты:

1. Все этапы 00–07 закрыты последним verifier verdict = `PASS`
2. Для каждого этапа существует complete artifact bundle в `.agent/stages/<stage-id>/`
3. Есть воспроизводимый локальный запуск
4. Есть seeded demo flow для customer, contractor и engineer
5. Есть regression/smoke path, который Codex может гонять в новых сессиях
6. MVP не выходит за guardrails и не уходит в преждевременный post-MVP scope
7. Результат пригоден не только для демо, но и для controlled pilot

---

## Что сознательно откладываем после MVP

- юридически значимая подпись
- самостоятельный отраслевой метрологический модуль сверх встроенных реестров и журналов
- несколько подрядчиков/несколько work types per request
- Bitrix24 production integration
- биллинг, trial/paywall, corporate site
- AI prediction / recommendation engine
- полный кадровый и ERP контур

---

## Рекомендуемый launch prompt для одного stage run

```text
Use $vrk-mvp-stage-orchestrator to execute stage <stage-id> from docs/roadmap.md in this repository.

Rules:
- You are the top-level stage orchestrator.
- Use gpt-5.5 with xhigh reasoning for the main run and every custom subagent.
- Keep the tree shallow: only the top-level stage orchestrator may spawn leaf subagents.
- Before coding, re-sync with AGENTS.md, docs/roadmap.md, .agent/stages/<stage-id>/progress.md, feature_list.json, git log, and smoke tests.
- Read docs/architecture/documentation-workflow.md before freezing or changing product/architecture/workflow decisions.
- Freeze the stage spec before implementation.
- Work one sprint contract at a time.
- Use bounded fan-out only when it reduces risk:
  - up to 3 read-only explorers before spec freeze;
  - up to 3 workers with explicit disjoint ownership after spec freeze.
- Keep one integration builder as the owner of the implementation and evidence bundle.
- Sync canonical docs and diagrams for decisions made in the slice before asking for proof.
- Run a fresh verifier after each evidence pack.
- If verifier fails, apply the smallest safe fix set and verify again with a fresh verifier.
- Do not mark anything done without proof.
- Update progress.md, feature_list.json, evidence.md, evidence.json, verdict.json and problems.md as appropriate.
- End in a clean mergeable state with a descriptive commit.
```
