# Sprint Contract

- Stage ID: 03-identity-master-data
- Slice ID: slice-005-metrology-journals-archiving-and-proof

## Objective

Запустить пятый bounded `Stage 03` slice: поверх уже proven `slice-001`, `slice-002`, `slice-003` и `slice-004` включить первый реальный контур, который имеет право заявлять:

- journal-driven metrology truth для `measuring instruments` и `standards`;
- derivation текущего статуса из latest valid journal record, а не из ручного baseline в карточке;
- archive-only lifecycle proof для:
  - equipment;
  - measuring instruments;
  - standards.

Slice не должен переоткрывать уже proven separate-registry contour из `slice-004`, не должен ломать `/contracts` baseline из `slice-003` и не должен widen-иться в `Stage 04` request runtime или `Stage 05` operational loops.

## Acceptance criteria

- `/equipment` остается canonical public contour для customer-side master-data surface;
- slice не создает parallel public route family для journals или archive views:
  - journal/history/archive surfaces живут внутри `/equipment` и его documented tab/detail/filter state;
  - если нужен query/state refinement, он документируется в evidence и canonical docs;
- separate registries из proven `slice-004` сохраняются:
  - equipment;
  - measuring instruments;
  - standards;
- metrology journal становится source of truth минимум для:
  - measuring instrument status;
  - measuring instrument next due / validity baseline, если это поле показывается в UI/API;
  - standard status;
  - standard next due / validity baseline, если это поле показывается в UI/API;
- journal record хранит как минимум:
  - subject type and subject id;
  - operation type;
  - operation date;
  - document number or document reference baseline;
  - valid-until / effective-until value, если операция задает период действия;
  - executor organization baseline;
  - comment baseline;
  - attachment metadata or truthful no-attachment state без ложного upload-claim;
- derived current status больше не принимается как manual truth из карточки:
  - карточка может кэшировать derived value;
  - proof обязан показать, что latest valid journal record переопределяет older record;
- latest valid journal record для slice proof трактуется минимально и тестируемо:
  - используется самый поздний применимый journal entry для конкретного subject;
  - proof строится на monotonic journal history без двусмысленных ties;
  - если implementation вводит дополнительные invalidation/tie-break rules, они фиксируются в Swagger/canonical docs в том же slice;
- archive-only lifecycle реализован минимум для equipment / measuring instruments / standards:
  - user contour не делает hard delete этих сущностей;
  - archive action сохраняет record в persistence и переводит его в archived state;
  - archived records не попадают в default active lists;
  - archived records не предлагаются в active relation pickers / active create flows;
  - archived records видимы только через explicit archived/includeArchived/archive tab/filter state;
- scoped access остается реальным и распространяется на journal/archive contour:
  - organization-scope пользователь видит весь допустимый active + archived contour своей организации;
  - subdivision-scope пользователь не видит unrelated records или journal history вне своего subtree;
  - unit-scope пользователь не видит broader active/archived records и broader journal history;
  - in-scope archived records и in-scope journal rows остаются видимыми соответствующему narrower scope;
- archive/journal contour не ломает proven public surfaces:
  - `/contracts` и backend `/agreements` adapter baseline из `slice-003` остаются доказуемыми;
  - `/equipment` public contour и separate registry truth из `slice-004` не регрессируют;
  - proven auth/bootstrap/scoped-access flows из `slice-001` и `slice-002` не регрессируют;
- canonical docs, OpenAPI и stage artifacts синхронизированы с реально реализованным slice.

## Transition / dependency rules

- Slice starts on top of the proven Stage 02 runtime/platform floor.
- Slice starts only after the proven:
  - `slice-001-first-admin-activation-and-org-graph`;
  - `slice-002-employee-invites-and-scoped-access`;
  - `slice-003-contracts-routing-and-workspace-access`;
  - `slice-004-equipment-mi-standard-registries`.
- The frozen Stage 03 spec remains valid; this refresh narrows only the active sprint contract and does not re-freeze the whole stage.
- This is the first Stage 03 slice allowed to claim:
  - journal-driven metrology truth;
  - derived status from latest valid record;
  - archive proof for equipment / measuring instruments / standards.
- Keep `/equipment` as the truthful public master-data entry contour unless repo truth forces a narrowly documented refinement.
- Do not widen into:
  - Stage 04 live request create/detail flows;
  - Stage 05 contractor execution, materials, documents, estimate approval, or acceptance loops;
  - parallel route families for MI journals, standard journals, or archives;
  - full org-scoped dictionary/local-draft proof unless minimally required by already-existing repo truth and explicitly documented;
  - net-new storage/document-center scope beyond journal attachment baseline already needed for truthful proof.
- If this slice clarifies latest-valid derivation, archive filters, or route-state assumptions beyond the current canonical docs, refresh the narrowest owning docs in the same slice before proof.

## File / module ownership

- `apps/backend/internal/app/**`
- `apps/backend/internal/auth/**`
- `apps/backend/internal/db/**`
- `apps/backend/internal/equipment/**`
- `apps/backend/migrations/**`
- `apps/backend/docs/swagger/**`
- `apps/web/app/(runtime)/**`
- `apps/web/app/api/**`
- `apps/web/features/**`
- `apps/web/entities/**`
- `apps/web/shared/**`
- `apps/web/tests/**`
- `docs/roadmap.md`
- `docs/PRD-MVP.md`
- `docs/architecture/identity-master-data.md`
- `docs/architecture/frontend-architecture.md`
- `docs/design/customer-admin-bootstrap-flow.md`
- `.agent/stages/03-identity-master-data/**`

## Build / test plan

- add or reshape protected backend journal contracts for measuring instruments and standards without collapsing the separate registries into one mega-payload;
- implement journal persistence so current metrology status is derived from journal history rather than only user-edited status baseline fields;
- keep derivation proof intentionally narrow:
  - prove ordering by journal history for one measuring instrument;
  - prove ordering by journal history for one standard;
  - avoid speculative status engines beyond what current docs require;
- add or reshape archive actions for equipment / measuring instruments / standards so active records are archived instead of hard-deleted in the normal user contour;
- ensure archived records are excluded from:
  - default active lists;
  - active create/edit pickers;
  - active journal-append flows when that would falsely resurrect archived entities;
- make journal and archive visibility depend on the current Stage 03 session/workspace contour:
  - organization scope;
  - subdivision scope;
  - unit scope;
- expose the live journal/archive contour to web through `/equipment` while preserving the proven separate-registry tabs from `slice-004`;
- add the necessary web route handlers under `apps/web/app/api/**` so browser code keeps using the public web boundary instead of the internal backend host;
- refresh Swagger/OpenAPI for changed journal/archive contracts and for any clarified derived-status rule;
- add a direct proof runner for `slice-005` that seeds or creates the minimal organization/auth baseline and produces:
  - journal derivation proof;
  - archive proof;
  - scope proof;
  - no-regression baseline for slices `001` to `004`;
- rerun sufficient floor proof showing no regression for earlier Stage 03 slices.

### Mandatory UI workflow

Because this slice touches `apps/web`, the builder must use `$vrk-web-ui-workflow` and record the proof path.

- Read:
  - `.impeccable.md`
  - `docs/design/ui-workflow.md`
  - `docs/design/serviceops-design-system.md`
  - `docs/architecture/frontend-architecture.md`
  - `docs/design/storybook-component-backlog.md`
- Run the component lookup with a metrology/archive target and save the raw result at:
  - `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-005-2026-04-19-orchestrator.txt`
- Preferred lookup target:
  - `equipment metrology journals history timeline archive archived filter status badge scope visibility attachments`
- Keep the decision order:
  - `reuse`
  - `extend`
  - `create`
- Expected reuse strategy:
  - keep `/equipment` and the existing registry workspace as the shell;
  - extend current feature-local `EquipmentRegistryWorkspace` and existing shared primitives before inventing a new reusable family;
  - keep journal/history/archive UI feature-local unless the lookup proves an obvious reusable candidate already exists;
- If a new reusable component family becomes unavoidable:
  - add stories;
  - update `docs/design/storybook-component-backlog.md`.
- Use `$impeccable craft` for the live `/equipment` journal/archive contour.
- Use `$polish` for final alignment.
- Run `$web-design-guidelines` on the changed UI files and close findings before proof.

## Proof requirements

- record the journal flow end-to-end with commands and captured outputs for:
  - one measuring instrument history walkthrough;
  - one standard history walkthrough;
- prove journal-driven derivation with concrete monotonic history:
  - create or seed an older journal record for the same measuring instrument;
  - create or seed a newer applicable journal record for that measuring instrument;
  - show that the derived current status / due baseline follows the newer valid record, not the older one;
  - repeat the same proof shape for one standard;
- prove archive-only lifecycle with concrete records:
  - archive at least one equipment record;
  - archive at least one measuring instrument record;
  - archive at least one standard record;
  - show that each archived record disappears from default active lists;
  - show that each archived record remains retrievable in explicit archived visibility state;
  - show that archived record persistence still exists and is not a disguised hard delete;
- prove scoped journal/archive visibility boundaries on the current auth model:
  - organization scope sees the full allowed active + archived contour;
  - subdivision scope sees only in-subtree journal rows and archived records;
  - unit scope sees only its own allowed journal rows and archived records;
  - forbidden direct access to broader unrelated journal/archive records is rejected;
- prove that archive state does not regress the proven separate-registry and relation contour from `slice-004`;
- rerun sufficient floor proof for slices `001`, `002`, `003`, and `004`:
  - auth/session/launch baseline;
  - scoped access baseline;
  - `/contracts` routing master-data baseline;
  - `/equipment` separate registry baseline;
- record OpenAPI refresh output and the exact canonical docs changed for the slice;
- record UI workflow evidence:
  - design brief source;
  - lookup query/result;
  - reuse/extend/create decision;
  - rationale for any `create`;
  - changed UI files;
  - stories/backlog update note if a new reusable family is introduced;
  - `$web-design-guidelines` result and finding closure;
- keep `verdict.json` pending until a fresh verifier reviews the implemented slice.

## Non-goals

- Stage 04 request create/detail runtime;
- Stage 05 contractor execution, assignments, materials, documents, estimates, or acceptance loops;
- parallel public route families outside `/equipment` for journals or archives;
- full standalone metrology module outside Stage 03 master-data contour;
- full org-scoped dictionary/local-draft proof unless current repo truth forces a narrowly documented inclusion;
- Stage 06 offline/sync behavior;
- custom role builder, deny-layer, 2FA, bulk import, and external identity providers.
