# Customer Admin Bootstrap Flow

Статус: accepted baseline  
Обновлено: 2026-04-18

## Назначение

Этот документ фиксирует, как user-provided Draw.io схема встраивается в текущий MVP roadmap VRK и где проходит каноническая граница между:

- `Stage 02` runtime/platform shell;
- `Stage 03` domain activation и master data;
- `Stage 04` request contour;
- более поздними operational ветками.

Сама большая Draw.io схема остается полезным обзорным артефактом, но **канонические stage boundaries** задаются этим документом и `docs/roadmap.md`.
Подробная доменная модель `Stage 03` вынесена в [`docs/architecture/identity-master-data.md`](../architecture/identity-master-data.md).

## Исходный артефакт

- editable Draw.io source: [`docs/design/diagrams/customer-admin-bootstrap-flow.drawio`](./diagrams/customer-admin-bootstrap-flow.drawio)
- origin: импортировано из user-provided файла `User flow (2).drawio` 2026-04-16

## Что покрывает исходная схема

Схема объединяет несколько разных слоев продукта:

- регистрация и вход;
- onboarding организации, подразделений и юнитов;
- оборудование и метрологические поля;
- сотрудники, приглашения и доступы;
- договоры, выбор подрядчика и приглашение подрядчика;
- плановые графики ТО/МО;
- материалы;
- более поздние ветки ремонта / модернизации / поставки.

Проблема схемы не в полноте, а в том, что она смешивает в один поток:

- ранний runtime shell;
- master data;
- request prerequisites;
- поздние contractor / operations сценарии.

Поэтому для roadmap она должна интерпретироваться поэтапно, а не как один monolithic Stage 02.

## Каноническая интерпретация для MVP

```mermaid
flowchart LR
    A["Stage 02<br/>platform foundation + product-shaped web shell"] --> B["Stage 03<br/>real auth / RBAC / org-graph / contracts / equipment / invite"]
    B --> C["Stage 04<br/>request contour becomes live"]
    C --> D["Stage 05<br/>contractor execution, materials, later operational loops"]
```

Диаграмма выше фиксирует не детальный UX, а **границу ответственности между stage-ами**. Большая Draw.io схема остается reference для route map и form surface coverage, но не отменяет stage split.

## Stage Mapping

### Stage 02: что переносим вперед

`Stage 02` должен реализовать не только голый platform bootstrap, но и **product-shaped runtime shell** для customer-admin flow:

- `/login`
- `/register`
- `/company` как company onboarding / profile shell
- `/equipment` как equipment contour:
  - empty state
  - add/import entry points
  - subdivision / unit context selection shell
- `/contracts` как contracts contour:
  - create contract shell
  - contractor lookup / invite shell
- `/requests` только как truthful gated placeholder до `Stage 04`

Что разрешено в `Stage 02`:

- mock / seed / stub data;
- route-level forms и validation shell;
- shared API client и explicit contract boundaries;
- public web naming `contracts`, даже если backend resource пока остается `agreements` внутри adapter boundary;
- honest placeholders для еще не включенных контуров.

Что **не** должно притворяться готовым в `Stage 02`:

- real auth / RBAC;
- persisted org / subdivision / unit / equipment / contract state;
- contractor invitation state machine;
- live request creation.

### Stage 03: что остается доменной активацией

`Stage 03` активирует те же surfaces из `Stage 02`, но уже на реальной доменной модели:

- first-admin activation по invite link и launch wizard вместо ручной раздачи паролей;
- auth / logout / refresh / role-aware access;
- org model:
  - organization profile
  - subdivisions
  - units
  - users / memberships / scoped grants
- employee invitations и invitation lifecycle;
- contracts registry;
- contractor lookup / invitation / activation baseline в рамках договорного контура;
- contract status baseline;
- equipment registry;
- measuring instruments registry;
- standards registry;
- metrology operation journals;
- access boundaries for customer / contractor contours.

Именно здесь onboarding flow перестает быть shell и становится реальным master-data контуром.

Каноническая object/access chain для этого stage:

```mermaid
flowchart TD
    A["Организация"] --> B["Подразделение (optional)"]
    A --> C["Юнит"]
    B --> C
    C --> D["Оборудование"]
    D --> E["СИ"]
    E --> F["Эталон"]
    U["Пользователь"] --> M["Membership"]
    M --> G["Scoped grant"]
    G --> A
    G --> B
    G --> C
```

### Stage 04: где включается requests contour

Схема не должна уводить request flow в `Stage 02`.
`Stage 04` остается местом, где:

- requests tab становится живым product contour;
- request create flow использует уже существующие equipment / contracts;
- маршрутизация в contractor contour идет из договорного контекста.

Правило из PRD не меняется: request нельзя создать без зарегистрированного оборудования.

### Stage 05: что читать как later operational flow

Следующие куски Draw.io не тянут `Stage 02` вперед и должны оставаться в более позднем operational contour:

- согласование графиков ТО/МО между причастными подразделениями и юнитами;
- выбор стороны материалов и работа со справочником материалов;
- более поздние execution branches, где нужны assignment, evidence и contractor-side processing.

Ближайший текущий дом для этих веток в roadmap — `Stage 05`, а не `Stage 02`.

## Что не переносим в текущий MVP без явного roadmap change

В Draw.io есть ветки, которые выходят за текущий MVP guardrail и поэтому **не меняют** канонический roadmap автоматически:

- модернизация;
- поставка.

Текущий MVP roadmap зафиксирован вокруг трех типов работ:

- ремонт;
- ТО;
- поверка.

Если модернизация и поставка понадобятся в каноническом scope, это должно идти отдельным doc-sync и roadmap update, а не молча наследоваться из импортированной схемы.

## Практическое правило для следующих slices

Если ближайший slice затрагивает `apps/web`, он должен использовать эту границу:

1. Сначала route shell и truthful UX-переходы.
2. Потом реальная доменная активация этих же экранов.
3. Потом request flow.
4. Потом contractor/operations loops.

Иными словами: Draw.io помогает строить экранную карту, но не отменяет staged delivery.
