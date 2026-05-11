# Stage Spec

- Stage ID: 03-identity-master-data
- Stage Name: Identity and master data

## Objective

Активировать поверх Stage 02 runtime shell реальный контур identity, access и master data: first-admin invite activation, постоянный `organization -> division -> unit` management UI, сотрудники и приглашения, scoped access, договоры, оборудование, средства измерения и эталоны.

## In scope

- first-admin activation по invite link и переход в постоянный `/company` management UI вместо ручной раздачи паролей и одноразового launch wizard;
- real auth flow для Stage 03 surfaces:
  - login
  - logout
  - refresh / session restore
  - role-aware access
- organization profile с разделением на launch-critical и optional requisites;
- division registry для подразделений/филиалов без user-facing selector-а типа;
- unit registry как primary operational scope, в том числе сценарий без промежуточного подразделения;
- user accounts, organization memberships и scoped grants как отдельные сущности;
- canonical role templates `organization_admin`, `organization_head`, `division_head`, `division_operator`, `unit_head`, `unit_operator`, `auditor`, role/scope compatibility и invitation lifecycle для сотрудников;
- contractor/customer relation layer и contracts registry как request-routing prerequisite;
- equipment registry with target semantics split between technological equipment and customer diagnostic equipment / СИ;
- standards / setup measures as `0..N` children of one diagnostic equipment record;
- metrology operation journals, URL/reference attachment baseline и status derivation from latest valid record;
- historical bounded ownership-scope labels for standards remain implementation floor only; broader org-scoped dictionary/local-draft CRUD deferred;
- archive baseline для ключевых master-data сущностей;
- canonical doc sync для product, architecture и stage boundaries.

## Out of scope

- live request contour и request detail workflow;
- contractor execution, materials, estimate approval и acceptance loops;
- fine-grained custom role builder по чекбоксам;
- Yandex ID как обязательный auth path;
- 2FA;
- массовый Excel import;
- автосоздание оргструктуры из внешних систем;
- physical delete для ключевых master-data сущностей;
- самостоятельный отраслевой метрологический модуль вне master-data contour.

## Source documents

- docs/roadmap.md
- docs/PRD-MVP.md
- docs/architecture/identity-master-data.md
- docs/design/customer-admin-bootstrap-flow.md
- docs/architecture/frontend-architecture.md
- AGENTS.md
- progress.md
- feature_list.json

## Product correction from 2026-04-29

Historical Stage 03 evidence proves the older launch-wizard implementation. The target product contract is now stricter:

- `/company/setup` and one-time launch wizard are not the desired UX;
- first-admin invite acceptance should land on `/company`;
- `/company` must support empty, partial, and populated organization states;
- organization-scope admins must be able to create first and later divisions/branches and units from the same persistent management surface;
- scoped admins can manage allowed access, employees, contracts, equipment, and structure inside their visible scope/subtree, while non-admin scoped users remain read-only;
- employee invite creation must not depend on a completed wizard, but division/unit-scoped invites still require an existing visible active target scope.

Treat this as a bounded follow-up Stage 03 correction before claiming product-complete org-structure management.

## Product correction from 2026-05-11

The customer meeting clarified the equipment/metrology domain and supersedes the older reusable-standards target:

- `measuring instrument` / `СИ` in this MVP means customer diagnostic equipment used by wagon repair facilities to check repair quality or unit condition;
- technological equipment remains ordinary production/repair equipment such as stands, shop equipment and installations;
- contractor equipment and contractor metrology equipment are out of MVP and must not be pulled into the customer-side equipment registry;
- standards / setup measures are kit objects for one diagnostic equipment record, with target cardinality `diagnostic equipment -> 0..N standards`;
- a working setup of a device against its own standard is not an official journal event; an official metrology journal event is the accredited-organization scenario with protocol/evidence.

The already-proven slice-004/slice-005 registry implementation remains historical proof, but the next equipment-domain correction must replace the target UI/data language:

- avoid presenting `СИ` as contractor-side or unrelated standalone equipment;
- stop planning standards as freely reusable records between multiple measuring instruments;
- keep `/equipment` as the single public customer route, but restructure its surface around technological equipment, diagnostic equipment and standards inside diagnostic equipment cards.

## Frozen phasing inside Stage 03

### Transition gate from Stage 02

- `Stage 02` is now fully proven and provides a stable runtime/platform floor for Stage 03.
- `Stage 03` may rely on:
  - the proven web runtime shell/docs boundary from Stage 02;
  - root startup and smoke contract from `Makefile` + `compose.platform.yml`;
  - the existing `apps/field` scaffold as a real, but still intentionally narrow, platform contour.
- If Stage 03 changes env/runtime/bootstrap assumptions, refresh Stage 03 docs and evidence in the same slice instead of mutating Stage 02 artifacts silently.
- `Stage 03` cannot be declared fully done until:
  - all required Stage 03 features are proven;
  - the last fresh verifier for Stage 03 returns `PASS`.

### Required slice order

`Stage 03` is executed as one bounded slice at a time in this order:

1. `slice-001-first-admin-activation-and-org-graph`
2. `slice-002-employee-invites-and-scoped-access`
3. `slice-003-contracts-routing-and-workspace-access`
4. `slice-004-equipment-mi-standard-registries`
5. `slice-005-metrology-journals-archiving-and-proof`
6. `slice-006-stage03-review-hardening`
7. `slice-007-stage03-admin-surface-auth-hardening`
8. `slice-008-stage03-multi-org-session-contract`
9. `slice-009-stage03-equipment-truthfulness`
10. `slice-010-stage03-org-structure-management`

```mermaid
flowchart LR
    A["Stage 02 shell + platform floor proven"] --> B["Slice 001<br/>first admin + org graph"]
    B --> C["Slice 002<br/>employee invites + scoped access"]
    C --> D["Slice 003<br/>contracts + workspace routing"]
    D --> E["Slice 004<br/>equipment + MI + standards registries"]
    E --> F["Slice 005<br/>journals + archiving"]
    F --> G["Slice 006<br/>review hardening"]
    G --> H["Slice 007<br/>admin auth hardening"]
    H --> I["Slice 008<br/>explicit session contract"]
    I --> J["Slice 009<br/>equipment truthfulness"]
    J --> K["Slice 010<br/>persistent /company org management"]
    K --> L["Stage 03 PASS"]
```

The diagram fixes the execution order after Stage 02 closure and after the later post-proof remediation wave: Stage 03 still starts from a stable runtime/platform floor, and the reopened slices remain bounded to truthfulness/product-correction fixes instead of widening into Stage 04 request scope.

## Acceptance criteria

- платформенный админ может создать организацию-заготовку и отправить first-admin invite;
- первый администратор принимает приглашение, задает пароль и попадает в `/company`, а не в пустой кабинет или одноразовый wizard;
- `/company` покрывает как минимум:
  - профиль организации;
  - empty / partial / populated states оргструктуры;
  - создание первого и последующих подразделений/филиалов;
  - создание первого и последующих юнитов, включая direct `organization -> unit`;
  - редактирование business fields: organization `propertyType`/`type` alias as legal-form selector `ООО` / `ПАО` / `НАО` / `ИП` with legacy `АО -> НАО`, `ЗАО -> НАО`, `ОАО -> ПАО`, `LLC -> ООО`; division/branch has no selectable type and stores hidden internal default only for compatibility; unit keeps operational type selector `ВРД` / `ВРЗ` / `ВУ` / `ВРП`; logo metadata and optional requisites are persisted; name, registeredAddress/address alias, leaderFullName with managerName migration/display compatibility, leaderPosition, contractPhone, contractEmail, actingBasis, plus region/status/comment where those fields still exist in the model;
  - архивирование подразделений/юнитов вместо удаления;
  - приглашение сотрудников с проверкой существующего target scope для division/unit invites;
  - entry points к добавлению оборудования после появления юнита;
- org/division/unit модель поддерживает иерархию с optional division;
- user account, membership и scoped grant разделены и доказаны сценариями доступа;
- organization-scope права наследуются вниз, division-scope права наследуются на дочерние unit, deny-layer отсутствует;
- canonical roles are enforced by scope: organization roles only on organization scope, division roles only on division scope, unit roles only on unit scope, and `auditor` on any organization/division/unit scope;
- Stage 03 v1 mutate capabilities are enabled for active customer `organization_admin`, `division_admin`, and `unit_admin`; profile actions stay organization-admin-only, while scoped admins are constrained to their visible scope/subtree;
- invitation statuses `draft`, `sent`, `opened`, `accepted`, `expired`, `revoked` видимы и воспроизводимы;
- login/session restore возвращает contour, привязанный к explicit active membership/grant: customer contour на `/company`, active contractor contour на `/contracts`;
- direct login с несколькими eligible memberships/grants truthfully возвращает `409`, а не silently выбирает один workspace;
- `/platform/organization-shells` и Stage 03 `organizations` admin surface не доступны анонимно и не раскрывают deployment-scoped admin credential в browser;
- contracts registry ограничивает допустимого подрядчика для следующего request stage;
- `/equipment` is a single customer equipment workspace with one `Новое оборудование` form, required type `Техническое` / `Диагностическое`, and one `Оборудование в учете` list;
- old `tab=mi` / `tab=standards` query params are compatibility-only and no longer expose separate user-facing registries;
- `СИ` is customer diagnostic equipment, and standards/setup measures are `0..N` children visible only inside their diagnostic equipment card;
- customer admins can add standards and physically delete existing standards from the diagnostic equipment edit modal; these standard deletions are not archive visibility events;
- standalone standards list and standards operation journal are removed from the target UI;
- the journal is a unified `Журнал операций по оборудованию`;
- текущий метрологический статус вычисляется из последней действующей записи журнала;
- archive используется вместо hard delete для equipment / diagnostic equipment rows, а archived rows открываются только через explicit archive visibility;
- канонические docs и stage artifacts синхронизированы и пригодны для Stage 04 handoff.

## Technical ownership / paths

- apps/backend/internal/auth/
- apps/backend/internal/db/
- apps/backend/docs/swagger/
- apps/web/app/(runtime)/
- apps/web/features/
- apps/web/entities/
- apps/web/shared/
- docs/roadmap.md
- docs/PRD-MVP.md
- docs/architecture/identity-master-data.md
- docs/design/customer-admin-bootstrap-flow.md
- .agent/stages/03-identity-master-data/

## Risks

- текущий legacy backend уже содержит ранние CRUD для организаций, оборудования, СИ и эталонов, но их модель не совпадает с новым Stage 03 contract;
- stage легко раздуть, если request workflow из Stage 04 или contractor execution из Stage 05 попадут в тот же slice;
- invite/auth flow и scoped access могут разойтись между backend и web, если не держать один canonical contract;
- метrology slice легко деградирует в денормализованные `last/next date`, если журнал операций не будет treated as source of truth;
- существующие route shells из Stage 02 могут начать притворяться live flow раньше реальной активации backend contract.

## Verification plan

- before each slice, re-sync the proven Stage 02 runtime/platform floor and check whether local assumptions still hold;
- verify each slice independently before moving to the next one;
- прогнать first-admin activation end-to-end;
- доказать first and repeat org/division/unit management через постоянный `/company` UI и scoped singular-session landing без multi-workspace picker;
- доказать invitation lifecycle и scoped access inheritance сценариями organization / division / unit;
- доказать truthful `409` при direct login, если у аккаунта несколько eligible access paths;
- доказать contracts registry и contractor restriction baseline;
- доказать единый `/equipment` workspace: без отдельных user-facing registries для `СИ` / эталонов, с diagnostic-owned standards внутри карточек и единым equipment journal;
- доказать journal-driven status calculation и archive behavior;
- зафиксировать updated canonical docs и diagram refs в evidence;
- завершать только после fresh verifier pass.
