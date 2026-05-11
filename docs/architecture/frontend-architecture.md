# Архитектура фронтенда и практики разработки

Статус: accepted baseline  
Обновлено: 2026-05-11

## Назначение

Этот документ фиксирует архитектуру и инженерные практики для `apps/web` в VRK.

Важно: после Stage 02 `apps/web` уже сочетает два слоя proof:

- Storybook-first UI foundation из Stage 01;
- product-shaped runtime shell из Stage 02 для `/login`, `/register`, `/company`, `/equipment`, `/contracts`, `/requests`.

## Смежные документы

- repo-wide source of truth: `docs/architecture/source-of-truth.md`
- doc-sync policy: `docs/architecture/documentation-workflow.md`
- roadmap stages for web contour: `docs/roadmap.md`
- identity/master-data model: `docs/architecture/identity-master-data.md`
- UI workflow: `docs/design/ui-workflow.md`
- design system and tokens: `docs/design/serviceops-design-system.md`
- Storybook source backlog: `docs/design/storybook-component-backlog.md`
- customer-admin flow mapping: `docs/design/customer-admin-bootstrap-flow.md`
- Git / PR / commit rules: `CONTRIBUTING.md`

## 0. Общие принципы

- Одна логическая задача = один обозримый PR.
- Перед новым паттерном сначала смотрим, как уже сделано в репозитории и в канонических docs.
- Интерфейс и пользовательский текст пишем на русском. Код, идентификаторы, типы и API-контракты держим на английском.
- По умолчанию предпочитаем server-first архитектуру, явные boundaries и минимальную гидрацию.
- Переиспользуемые UI-срезы считаются законченными только вместе со stories, обязательными state variants и review gate из `docs/design/ui-workflow.md`.
- Если реализация изменила или уточнила правила из этого документа, doc-sync обязателен в той же сессии.

## 1. Целевой стек и контур

Планируемый web baseline для VRK:

- `apps/web` — `Next.js` App Router + `React` + `TypeScript`
- UI stack — `Tailwind CSS`, `Radix UI primitives`, shadcn/ui-style open code, `class-variance-authority`, shared `cn()`
- forms — `react-hook-form` + `zod`
- data-dense surfaces — `@tanstack/react-table`
- charts — `recharts`
- icons — `lucide-react`
- backend integration — `apps/backend` через REST + OpenAPI contract

Этот документ описывает прежде всего `apps/web`.
`apps/field` уже существует как отдельный PWA-first scaffold, но базовые правила по типизации, data layer, naming и doc-sync должны оставаться согласованными между контурами.

### 1.1. Текущий Stage 01 baseline

Сейчас `apps/web` состоит из трех согласованных, но намеренно разделенных слоев:

- `Next.js` App Router app для минимального landing shell и будущего runtime growth path;
- reusable base в `shared/*`: design tokens, story helpers и UI primitives;
- Vite-backed Storybook harness с Wave 1 slices в `widgets/*` и `entities/*` для layout/navigation, auth baseline, request-list baseline и showcase-композиций без раннего смешивания со Stage 02 runtime wiring.

```mermaid
flowchart LR
    A["docs/design/serviceops-design-system.md"] --> B["apps/web/shared/config + shared/storybook"]
    B --> C["apps/web/shared/ui primitives"]
    C --> D["widgets/OperatorShell + widgets/Auth"]
    C --> E["entities/Request"]
    D --> F["stories/layout + stories/auth + stories/showcases"]
    E --> G["stories/requests + stories/showcases"]
    C --> H["stories/foundations + stories/primitives"]
    F --> I["Storybook proof harness (react-vite)"]
    G --> I
    H --> I
    C --> J["apps/web/app minimal Next.js shell"]
```

Диаграмма фиксирует Stage 01 contract: design tokens и story helpers питают shared primitives, поверх которых уже собраны Wave 1 `widgets` и `entities`. Этот слой не исчезает после Stage 02, а продолжает быть reusable foundation для runtime shell.

### 1.2. Замороженный growth path для Stage 02

Граница следующего роста `apps/web` теперь дополнительно заморожена в `docs/design/customer-admin-bootstrap-flow.md`.

Это означает:

- `Stage 02` поднял **product-shaped runtime shell** для `/login`, `/register`, `/company`, `/equipment`, `/contracts` и gated `/requests`;
- эти surfaces могут жить на mock / seed / stub data, если Stage 03 доменная модель еще не активирована;
- real auth/session/RBAC, invite-based activation, persisted `organization -> division -> unit` state, scoped access grants, contracts/equipment/MI/standards CRUD и invitation workflows остаются ответственностью `Stage 03`;
- requests contour не должен ложно “оживать” в `Stage 02`: допустим только truthful gated placeholder до Stage 04.

### 1.2.1. Stage 03 runtime contour для slice-001 и target correction

После реализации `slice-001-first-admin-activation-and-org-graph` в `apps/web` одновременно живут два правдивых режима:

- анонимный пользователь все еще видит Stage 02 shell на `/company`, пока у него нет сессии;
- платформенный админ выпускает invite через `/register`;
- historical slice-001 implementation проводит приглашенного администратора по пути `/register/[token] -> /company/setup -> /company`;
- target correction от 2026-04-29 заменяет этот одноразовый wizard на путь `/register/[token] -> /company`, где первый и последующие дивизионы и юниты создаются через organization management UI;
- `/company` разделяет semantics поля `Тип`: профиль организации показывает legal-form selector `ООО` / `ПАО` / `НАО` / `ИП`, дивизион не показывает type selector, а юнит сохраняет operational type selector `ВРД` / `ВРЗ` / `ВУ` / `ВРП`;
- `/company` показывает optional requisites и логотип; логотип загружается через `app/api/company/logo`, а browser получает только authenticated proxy URL, не S3 object key;
- `/company` держит вкладки `Дивизионы` и `Юниты` как list-first поверхности: реестр занимает полную ширину, create action живет в header/empty state списка и открывает отдельный Dialog; edit actions не подставляют значения в create forms;
- редактирование дивизионов и юнитов открывается отдельным modal PATCH surface с focus trap, `Escape`/backdrop close и restore focus, аналогично registry edit dialogs в `/equipment`;
- server-side runtime layout читает текущую session и не пускает активированного администратора в пустой shell;
- browser не ходит напрямую в container-only backend host: Next route handlers в `app/api/*` проксируют invite/session/bootstrap requests к `apps/backend`;
- `/api/platform/organization-shells` inject-ит `X-VRK-Platform-Admin-Secret` только на server side из `PLATFORM_ADMIN_SHARED_SECRET`, поэтому browser не видит deployment-scoped admin credential;
- текущая session хранится в HttpOnly cookie `vrk_session`, а server components читают ее через request-scoped `fetchSessionSummary`, чтобы layout и page не дублировали один и тот же backend call в рамках одного запроса.

```mermaid
flowchart LR
    A["Browser"] --> B["Next app routes / pages"]
    B --> C["Next route handlers /app/api/*"]
    C --> D["apps/backend REST"]
    D --> C
    C --> E["HttpOnly vrk_session cookie"]
    E --> B
    B --> F["/company<br/>org management<br/>create dialogs"]
```

### 1.2.2. Реализованный Stage 03 runtime contour для slice-002

После реализации `slice-002-employee-invites-and-scoped-access` web contour расширился поверх того же runtime skeleton, но без widening в Stage 04:

- `/register/[token]` теперь является общим activation route для first-admin и employee invites;
- Next route handlers в `app/api/auth/invites/*`, `app/api/auth/employee-invites/*` и `app/api/auth/employees/*` закрывают browser от прямого доступа к internal backend host и держат cookie/session boundary на стороне `apps/web`;
- `/company` стал scope-aware landing page:
  - organization-scope пользователь видит весь org graph; вкладка `Сотрудники` появляется при `workspace.canViewEmployees`, а invite/edit/deactivate controls только при admin-флагах;
  - division-scope пользователь видит только свой дивизион и его child units; `division_admin` получает scoped invite/edit/deactivate controls, а `division_head` и scoped `auditor` получают read-only employees registry;
  - unit-scope пользователь видит только один юнит и не видит broader org graph; `unit_admin` получает scoped invite/edit/deactivate controls, а `unit_head` и scoped `auditor` получают read-only employees registry;
- employee invites стали list-first: `EmployeeInviteManager` показывает `Статусы приглашений` full-width, а `Пригласить сотрудника` открывает create Dialog из header списка или empty state;
- `/login` после employee acceptance больше не возвращает пользователя в generic shell, а сразу восстанавливает его сохраненный scoped contour;
- ссылка `политикой доступа` в login consent ведет на `/access-policy`, где временно живет non-legal draft/stub политики до замены юридически оформленной редакцией;
- checkbox `Запомнить вход` на `/login` управляет только web-session UX: checked ставит HttpOnly `vrk_session` cookie с 24h `maxAge` и сохраняет localStorage-подсказку последнего workspace по hash нормализованного email; unchecked ставит session cookie без `maxAge` и чистит подсказку для текущего email;
- last workspace hint является display-only: он показывается только после ввода matching email, не отправляется в `/api/auth/session`, не хранит `grant_id` и не может выбирать workspace вместо backend;
- ссылка `Сбросить пароль` на `/login` ведет на `/password-reset`, где до production-like backend/email flow живет честная informational заглушка и встроенный prompt для следующего implementation slice;
- Stage 03 намеренно не строит workspace picker UI: session остается singular и привязана к explicit active `grant_id`;
- если backend при direct login находит несколько eligible memberships/grants, `/api/auth/session` возвращает truthful `409`, а web показывает conflict instead of silently landing in an arbitrary contour.

```mermaid
flowchart LR
    A["/login form"] --> B["POST /api/auth/session"]
    B --> C["apps/backend /sessions<br/>email + password only"]
    C --> D["SessionSummary<br/>membership_id + grant_id"]
    D --> E["HttpOnly vrk_session cookie"]
    D --> F["localStorage hint<br/>email hash + display fields"]
    F -. "matching email only" .-> A
```

```mermaid
flowchart LR
    A["/company<br/>employees tab"] --> B["EmployeeAccessWorkspace"]
    B --> C["/api/auth/employees*"]
    B --> D["EmployeeInviteManager<br/>admin only"]
    D --> E["/api/auth/employee-invites*"]
    E --> F["public token"]
    F --> G["/register/[token]"]
    G --> H["/api/auth/invites/*"]
    H --> I["HttpOnly vrk_session"]
    I --> J["/company scoped landing"]
```

### 1.2.3. Реализованный Stage 03 runtime contour для slice-003

После реализации `slice-003-contracts-routing-and-workspace-access` contracts contour перестал быть shell-only surface и стал реальным Stage 03 runtime boundary:

- публичный web route остается `/contracts`, даже если backend по-прежнему использует explicit adapter boundary `/agreements`;
- `app/api/contracts*` скрывает legacy backend naming от browser и держит public naming стабильным;
- customer `organization_admin` на organization scope получает live contracts registry, contractor lookup и routing preview;
- минимальный contract status baseline зафиксирован как `inactive / active / expired`;
- routing preview определяет допустимого contractor из eligible contract context, а не из free-form выбора на будущем request step;
- contractor login и session restore для active contractor organization возвращают `workspace.landingPath = "/contracts"`;
- contractor-side `/contracts` показывает только customer contracts, привязанные к contractor organization, без расширения в customer org graph и без доступа к unrelated contracts.

```mermaid
flowchart LR
    A["Customer login"] --> B["/company"]
    B --> C["/contracts"]
    C --> D["app/api/contracts*"]
    D --> E["apps/backend /agreements*"]
    E --> F["contract registry + routing resolve"]
    G["Contractor login"] --> H["workspace.landingPath = /contracts"]
    H --> I["contractor-only contracts workspace"]
    F --> I
```

### 1.2.4. Реализованный Stage 03 runtime contour для slice-004

После реализации `slice-004` и `slice-005` master-data contour на публичном route `/equipment` перестал быть shell-only surface и стал реальным Stage 03 registry boundary. Исторический floor доказал отдельные backend resources для equipment, measuring instruments, standards, journal/archive и scoped access, но product correction от 2026-05-11 заменяет user-facing модель.

Target `/equipment` frontend contract:

- публичный web route остается `/equipment`;
- server page сохраняет `archived=1` как explicit archive visibility state;
- старые `tab=mi` и `tab=standards` остаются compatibility-only input и нормализуются к единому workspace, не открывая отдельные registry tabs;
- `app/api/equipment*` по-прежнему скрывает browser от internal backend host;
- анонимный пользователь видит truthful shell без live scoped records;
- contractor session не получает customer equipment registry;
- customer users попадают в один `EquipmentRegistryWorkspace`;
- customer admins с `manage_equipment` получают create/edit/archive/journal controls внутри visible scope/subtree;
- read-only роли видят single-column scope-filtered registry и journal history без create/edit/archive placeholders;
- mutation surfaces (`Добавить оборудование` create Dialog, edit/archive actions, journal entry form) рендерятся только при `manage_equipment`;
- manage UI показывает две верхнеуровневые client-side вкладки на том же route:
  - `Оборудование` как default tab с surface `Оборудование в учете`;
  - create action `Добавить оборудование`, который открывает Dialog `Новое оборудование` с типом `Техническое` / `Диагностическое`;
  - diagnostic equipment card with owned standards inside the card;
  - diagnostic edit modal with add-on-save and hard-delete-on-save controls for owned standards;
  - `Журнал операций` как separate tab с surface `Журнал операций по оборудованию`.

```mermaid
flowchart LR
    A["Browser /equipment<br/>old tab params optional"] --> B["Next page"]
    B --> C["EquipmentRegistryWorkspace"]
    C --> T{"UI tab"}
    T -->|"Оборудование"| H["Оборудование в учете"]
    T -->|"Журнал операций"| K["Журнал операций по оборудованию"]
    H --> D["Add equipment action<br/>create Dialog"]
    D --> E{"Тип оборудования"}
    E -->|"Техническое"| F["technical payload"]
    E -->|"Диагностическое"| G["diagnostic payload<br/>owned standards 0..N"]
    H --> I["technical cards"]
    H --> J["diagnostic cards<br/>standards inside"]
    J --> M["edit modal<br/>add / hard-delete standards on save"]
    C --> L["archive visibility<br/>shared control"]
```

Диаграмма фиксирует текущий target boundary: route остается прежним, но old registry tabs (`mi`, `standards`) and standalone standards list are no longer part of the user-facing workspace.

### 1.2.5. Runtime contour for equipment correction

The frontend may continue using existing Next proxy routes while the backend migrates conservatively:

- technical equipment can still map to `/api/equipment`;
- diagnostic equipment may still map to `/api/equipment/measuring-instruments` as implementation detail;
- standards are created/viewed only through diagnostic equipment context in the UI;
- customer admins can add new owned standards and physically delete existing owned standards from the diagnostic equipment edit modal; these changes are queued locally until `Сохранить изменения`;
- standard journals are not exposed in the target UI;
- unified equipment journal uses the diagnostic/equipment journal endpoint selected by the chosen equipment record;
- edit/archive controls and journal mutation forms stay hidden for archived records and hidden from sessions without `manage_equipment`;
- data fetching keeps pagination `meta` and `includeArchived=true` only when archive visibility is explicit;
- active relationship controls must never surface archived records or reusable standards.

```mermaid
flowchart LR
    A["EquipmentRegistryWorkspace"] --> B["/api/equipment* proxy"]
    B --> C["backend scoped registry services"]
    C --> D["technical equipment"]
    C --> E["diagnostic equipment implementation boundary"]
    E --> F["owned standards"]
    E --> G["equipment journal history"]
    A --> H["session capability gate"]
    H --> I["manage_equipment mutate"]
    H --> J["read-only subtree"]
```

Эта диаграмма фиксирует frontend/backend boundary during the correction: UI already follows the unified product model even if storage keeps legacy service boundaries as compatibility layer.

### 1.3. Field scaffold boundary

`apps/field` в Stage 02 существует только как PWA-first scaffold:

- есть manifest-backed shell и mobile-first layout;
- есть явные API/sync boundaries;
- нет live offline engine, draft storage и conflict resolution.

Для platform/runtime orchestration см. `docs/architecture/platform-runtime-baseline.md`.

## 2. Архитектурный каркас: Adapted FSD для `apps/web`

Целевые слои сверху вниз:

```text
apps/web/app        # routing, layouts, page composition, route-level data orchestration
apps/web/widgets    # page sections and screen blocks
apps/web/features   # user actions and scenario-specific interaction slices
apps/web/entities   # domain entities: types, view-models, presentational building blocks
apps/web/shared     # reusable base: ui, lib, api, config, types
```

`features` может появиться не в первом коммите `apps/web`, но direction of growth фиксируем сразу, чтобы не складывать сценарную логику в `widgets` и `entities`.

### 2.1. Направление импортов

Импортируем только вниз по слоям:

```text
app      -> widgets, features, entities, shared
widgets  -> features, entities, shared
features -> entities, shared
entities -> shared
shared   -> external packages only
```

```mermaid
flowchart TD
    A["app"] --> B["widgets"]
    A --> C["features"]
    A --> D["entities"]
    A --> E["shared"]
    B --> C
    B --> D
    B --> E
    C --> D
    C --> E
    D --> E
```

Если для решения задачи хочется импортировать модуль "вверх", значит slice boundaries выбраны неверно или public API неполный.

### 2.2. Public API: импорт только из корня слайса

Каждый slice обязан иметь `index.ts`, который экспортирует только публичный интерфейс.

```ts
// good
import { RequestCard } from "@/entities/Request";

// bad
import { RequestCard } from "@/entities/Request/ui/RequestCard";
```

Если коду нужен внутренний файл, сначала расширяем `index.ts`, а не обходим public API.

### 2.3. Именование директорий

- слой: `lowercase` — `shared`, `widgets`, `entities`
- slice: `PascalCase` — `Request`, `RequestList`, `AuthSession`
- технические директории внутри slice: `lowercase` — `ui`, `model`, `lib`, `api`, `types`

Пример:

```text
apps/web/entities/Request/
  index.ts
  ui/
    RequestCard.tsx
    RequestStatusBadge.tsx
  model/
    request-status.ts
  types/
    request.ts
```

## 3. Ответственность по слоям

### 3.1. `app/`

- содержит route handlers, layouts, pages, route groups и app-level providers
- собирает страницы из `widgets`, `features`, `entities`
- вызывает data layer и приводит данные к props экранов
- не превращается в место для сложной domain-логики и долгих JSX-композиций
- `default export` допустим только там, где это требует Next.js

### 3.2. `widgets/`

- готовые секции и screen blocks
- собирают `entities`, `features` и `shared/ui`
- не ходят напрямую в backend и не читают env
- не владеют глобальными app decisions вроде auth bootstrap, router wiring и cache contract

### 3.3. `features/`

- инкапсулируют пользовательские действия и локальные сценарии
- содержат форму, mutation flow, optimistic/local pending state и success/error plumbing
- не становятся page-level контейнерами и не дублируют базовые entity components

### 3.4. `entities/`

- описывают доменные типы, view-models и компоненты показа данных
- допустимы `Card`, `Row`, `Badge`, `Preview`, `Summary` и аналогичные read-oriented компоненты
- без route composition и без кросс-страничных сценариев

### 3.5. `shared/`

- reusable UI primitives
- `lib` и чистые helpers
- `api` и transport layer
- `config` и env access
- базовые типы, которые не принадлежат одной доменной сущности

В `shared` не живет прикладная логика конкретной заявки, договора, оборудования или роли.

## 4. Data layer и интеграция с backend

Цель: в проекте должен быть один понятный слой доступа к данным, а не случайные `fetch()` по JSX-дереву.

Рекомендуемый baseline:

```text
apps/web/shared/api/
  client/        # base HTTP client, auth/session wiring, common errors
  contracts/     # public web boundary; during Stage 02 may adapt backend agreements resource
  requests/      # domain-specific queries/mutations
  equipment/
```

Правила:

- backend вызывается через `shared/api/*`, а не напрямую из `widgets`, `entities/ui` или `shared/ui`
- raw API response не протаскивается в UI без адаптации
- mapping в view-model делаем в data layer или route-level orchestration в `app/`
- cache behavior (`revalidate`, tags, bypass, no-store) должен быть явным и единообразным
- ошибки транспорта и contract-level ошибки нормализуются в одном месте
- auth/session contract читается централизованно, а не размазанно по компонентам
- `app/api/*` route handlers должны собираться из общих proxy primitives в `shared/api`, а не копировать вручную `cookies -> auth header -> backend -> error mapping`
- query/search params, которые составляют часть backend list/filter contract, должны проксироваться через web boundary без выборочного "съедания" отдельных полей
- internal backend base URL читается из `INTERNAL_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL`, а не хардкодится в UI routes

### 4.1. Где живет state

Предпочтение по порядку:

1. server data в `app/` и server components
2. URL/search params для фильтров, сортировки и shareable screen state
3. local component state для ephemeral UI behavior
4. общий client store только если есть доказанный cross-route или cross-widget use case

Глобальный client store не считается baseline по умолчанию. Если он появится, решение должно быть явно задокументировано отдельным doc-sync.

## 5. Storybook-first и reusable UI

Для VRK shared UI и reusable domain components должны разрабатываться через Storybook-first workflow из `Stage 01`.

Правила:

- `docs/design/storybook-component-backlog.md` является source backlog для shared/component work
- новые reusable primitives и domain UI-срезы поставляются вместе со stories
- перед созданием или заменой shared/domain UI нужно прогнать repo-local lookup helper `python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "<need>"`
- порядок решений фиксирован: `reuse` существующий компонент -> `extend` существующий компонент -> `create` новый компонент только при отсутствии жизнеспособного кандидата
- если создается net-new reusable component, вместе с ним обновляются stories и backlog, когда появился новый reusable family или missing backlog slice
- обязательные states:
  - interactive components: `Default`, `Hover`, `Focus`, `Disabled`
  - data components: `Loading`, `Empty`, `Error`
  - responsive components: `Desktop`, `Mobile`
- Storybook подтверждает composability и visual states, но не заменяет route integration и business smoke
- если UI-срез меняет component API, tokens или state behavior, обновляем stories и канонические docs вместе
- дублирующий reusable component с пересекающейся ответственностью считается architecture drift и verifier proof gap

```mermaid
flowchart TD
    A["Нужен reusable или domain UI component"] --> B["Прогнать Storybook component lookup"]
    B --> C{"Есть жизнеспособный story-backed кандидат?"}
    C -->|Да, полностью подходит| D["Reuse existing component"]
    C -->|Да, но нужен малый gap fix| E["Extend existing component API/variants/states"]
    C -->|Нет| F["Create new component and stories"]
    E --> G["Обновить stories и evidence"]
    D --> G
    F --> H["Обновить backlog, если это новый family или missing slice"]
    H --> G
```

Диаграмма фиксирует обязательный decision path для reusable UI: сначала поиск по текущему Storybook inventory, затем строгое решение reuse/extend/create без параллельных компонентных семейств.

## 6. Константы, конфиг и окружение

### 6.1. Уровни констант

1. Локальные константы держим рядом с использованием.
2. Slice-specific константы выносим в `model/constants.ts` или `lib/constants.ts`.
3. Project-wide константы размещаем в `shared/lib`, `shared/api` или `shared/config`.

### 6.2. Именование

- экспортируемые таблицы и наборы значений: `SCREAMING_SNAKE_CASE`
- локальные константы внутри файла: `camelCase`
- дизайн-токены должны жить в theme/tokens слое, а не внутри JSX

### 6.3. `as const`, unions и type guards

```ts
export const REQUEST_PRIORITIES = ["normal", "high", "critical"] as const;

export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export function isRequestPriority(value: unknown): value is RequestPriority {
  return REQUEST_PRIORITIES.some((priority) => priority === value);
}
```

### 6.4. `process.env`

- env читается в одном месте: `shared/config/*`
- обязательные переменные валидируются на старте
- UI-код не должен читать `process.env` напрямую из случайных компонентов

## 7. Нейминг и стиль кода

### 7.1. Файлы и экспорты

- React components: `PascalCase.tsx`
- utilities and helpers: `kebab-case.ts`
- `index.ts`: только public API, без логики
- вне `app/` по умолчанию используем `named export`

### 7.2. Типы и props

- типы и интерфейсы: `PascalCase`
- props: `ComponentNameProps`
- callbacks в props: `onSubmit`, `onChange`, `onOpen`
- обработчики внутри компонента: `handleSubmit`, `handleOpen`

### 7.3. Переменные и функции

- boolean: `is*`, `has*`, `can*`, `should*`
- коллекции: множественное число
- функции: глагол + объект (`fetchRequests`, `buildRequestHref`, `mapRequestToCardModel`)

### 7.4. Импорты

Порядок:

1. `react`, `next/*`
2. third-party packages
3. внутренние `@/*`
4. относительные импорты
5. `import type ...`

## 8. TypeScript rules

- держим `strict: true`
- `any` избегаем; если тип неизвестен, используем `unknown` и guard
- `as Type` без валидации не считаем нормой
- для конфигов и map-объектов предпочитаем `satisfies`
- contract types и UI view-models не смешиваем без явного mapping layer
- `import type` используем для type-only imports
- domain states и async states по возможности оформляем через discriminated unions, а не через набор несвязанных boolean-флагов

## 9. Next.js и React практики

### 9.1. Server Components по умолчанию

- `'use client'` добавляем только там, где реально нужны state, effects, browser APIs или interactive handlers
- page composition и data orchestration по умолчанию остаются server-side
- тяжелую client-only логику не поднимаем выше необходимого leaf boundary

### 9.2. Формы и мутации

- формы строим на `react-hook-form` + `zod`
- mutation flow живет в `features` или в специально выделенном interaction slice
- optimistic UI допускается только там, где rollback и error state продуманы заранее

### 9.3. Производительность и media

- используем `next/image` вместо голого `<img>`, когда это уместно
- фиксируем размеры и `sizes`, чтобы не ловить layout shift
- `priority` применяем только для реально above-the-fold контента
- не строим интерфейс на тяжелых blur/frosted/glow-эффектах, которые противоречат design system и operational density

### 9.4. Опасные места

- `dangerouslySetInnerHTML` допускается только для доверенного и явно ограниченного контента
- не используем его для сборки UI
- route-level loading, empty и error states считаются обязательной частью реализации, а не "добьем потом"

## 10. Стили, токены и component API

Правила:

- используем semantic tokens из `docs/design/serviceops-design-system.md`
- новые цвета, радиусы, тени и motion values оформляем в токенах, а не размазываем по JSX
- без inline styles, кроме точечных случаев с динамическими CSS variables, где это действительно оправдано
- классы объединяем через `cn()`
- reusable component принимает `className` и не навязывает внешние margins
- по возможности компонент имеет предсказуемые `variant`, `size`, `tone`
- важные компоненты обязаны покрывать `disabled`, `loading`, `empty`, `error`, если эти состояния релевантны

Не создаем параллельные component families без сильной причины. Сначала проверяем, можно ли расширить уже существующий primitive или pattern.

## 11. A11y и SEO как часть DoD

Для каждой страницы, виджета и reusable UI-секции проверяем:

- корректную семантику: `main`, `nav`, `section`, правильные heading levels
- доступность с клавиатуры
- видимый `focus-visible`
- label/description/error text для форм
- контраст и читаемость в data-dense сценариях
- понятные empty/error/loading states
- `title`, `description` и другие SEO-поля для публичных и индексируемых страниц, если такие появятся

Для внутренних кабинетных экранов SEO вторично, но семантика, фокус и читаемость обязательны всегда.

## 12. Что запрещено

- импортировать "вверх" по слоям
- импортировать внутренности slice вместо `index.ts`
- вызывать backend из UI-компонентов напрямую
- складывать доменную логику в `shared/ui`
- протаскивать raw backend contract в JSX без mapping
- размазывать raw hex и magic spacing values по компонентам
- читать `process.env` из случайных файлов
- коммитить `.env*` и секреты
- делать god component на сотни строк без очевидной причины и без декомпозиции
- добавлять второй похожий primitive, если уже существует базовый компонент, который можно расширить

## 13. Практическое правило для будущих stage-срезов

Когда `apps/web` появится, каждый frontend slice должен отвечать на четыре вопроса:

1. В каком слое живет этот код и почему?
2. Почему его import direction не нарушает Adapted FSD?
3. Где проходит граница между backend contract, view-model и UI component API?
4. Какие docs, stories и state variants нужно обновить вместе с кодом?

Если на любой вопрос нет ясного ответа, архитектурный slice еще не достаточно сформулирован.
