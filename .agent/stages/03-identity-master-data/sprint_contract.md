# Sprint Contract

- Stage ID: `03-identity-master-data`
- Slice ID: `slice-014-equipment-domain-correction`
- Status: `PENDING` until implementation evidence and one fresh verifier `PASS`

## Objective

Replace the historical `/equipment` tabbed registry model with a single customer equipment workspace that matches the clarified domain:

- ordinary production/repair equipment is `technical`;
- customer `СИ` is `diagnostic` equipment used to check repair quality or unit condition;
- standards/setup measures are owned children of one diagnostic equipment record;
- official metrology operations are recorded in one equipment journal, not in a separate standard journal;
- contractor-side metrology equipment stays out of MVP.

Do not widen this slice into Stage 04 request workflows, contractor execution, Аршин integration, accredited-organization equipment registries, or a separate metrology module.

## Frozen Decisions

- Public route stays `/equipment`.
- User-facing tabs/switchers `Оборудование / СИ / Эталоны` are removed.
- Old query params such as `tab=mi` and `tab=standards` must not break the page. They may normalize to `/equipment` or render the same unified workspace.
- The page has one working surface: `Оборудование в учете`.
- The create surface is one form titled `Новое оборудование`.
- The form has a required equipment type selector:
  - `Техническое`;
  - `Диагностическое`.
- Technical equipment uses ordinary equipment fields.
- Diagnostic equipment uses diagnostic/СИ fields and an inline dynamic list of `0..N` standards/setup measures.
- Standards are not reusable between equipment records in the target contract.
- A standard can be viewed only inside its parent diagnostic equipment card.
- There is no standalone standards list in the target UI.
- There is no standard operations journal in the target UI.
- The journal block is a unified `Журнал операций по оборудованию` and is selected by equipment record.
- Explicit archive visibility remains.
- Existing access behavior remains:
  - customer admins with `manage_equipment` can create, edit, archive, add standards, and add journal entries inside visible scope;
  - read-only roles see only their allowed subtree;
  - contractor sessions do not receive the customer equipment registry.

## Acceptance Criteria

- `/equipment` header is `Оборудование`.
- Capability badge is `Управление реестром` or `Только просмотр`.
- There is no visible tab/switcher containing `Оборудование / Средства измерения / Эталоны`, `Оборудование / СИ / Эталоны`, or an equivalent three-registry navigation.
- A single create form `Новое оборудование` is present for manageable customer sessions.
- The equipment type control exposes `Техническое` and `Диагностическое`.
- Technical card content includes ordinary equipment fields, status, edit/archive actions when allowed, and respects archived visibility.
- Diagnostic card content includes basic diagnostic fields, `ФИФ`, serial number, `Эталоны: N`, standards/setup measures inside the card, and latest journal status.
- Standards are not exposed as a free create/list surface and copy does not describe them as reusable registry records.
- The journal area is titled `Журнал операций по оборудованию` and chooses from the unified equipment list.
- Archived equipment rejects new journal/standard mutations but keeps read-only history.
- API/persistence either migrate to `equipment -> owned standards -> equipment journal` or conservatively hide old measuring-instrument storage behind the target response model.
- If persistence/API changes, migrations, backend services/repositories, tests, and Swagger/OpenAPI are refreshed.
- Storybook `EquipmentRegistryWorkspace` stories are updated for:
  - `TechnicalEquipmentList`;
  - `DiagnosticEquipmentWithStandards`;
  - `DiagnosticEquipmentWithoutStandards`;
  - `UnifiedJournal`;
  - `ScopedReadonly`;
  - `ArchiveVisible`;
  - `LoadError`;
  - `LongEquipmentList`.
- Targeted `/equipment` smoke/e2e proof is updated for the unified workspace and old tab params tolerance.
- Canonical docs and stage artifacts describe the implemented contract without leaving old reusable-standard or tabbed-registry copy as current behavior.

## Proof Requirements

- Harness / stage artifacts:
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
  - `jq empty .agent/stages/03-identity-master-data/evidence.json .agent/stages/03-identity-master-data/feature_list.json .agent/stages/03-identity-master-data/verdict.json`
- UI workflow:
  - use `$vrk-web-ui-workflow`;
  - read `.impeccable.md`, `docs/design/ui-workflow.md`, `docs/design/serviceops-design-system.md`, `docs/architecture/frontend-architecture.md`, and relevant equipment files before UI edits;
  - run `python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "equipment registry diagnostic equipment standards journal"`;
  - record lookup result, `reuse` / `extend` / `create` decision, changed UI files, and `$web-design-guidelines` result.
- Backend checks if backend/API/persistence changes:
  - gofmt on touched Go files;
  - backend tests;
  - backend build;
  - Swagger/OpenAPI refresh if annotations or schema changed.
- Web checks:
  - `pnpm run web:typecheck` or repo-equivalent command;
  - `pnpm run web:lint` or repo-equivalent command;
  - `pnpm run web:build` or repo-equivalent command;
  - Storybook build command used in this repo.
- Targeted proof:
  - create technical equipment;
  - create diagnostic equipment with two owned standards;
  - prove a standard is not reusable/linkable by another equipment record;
  - create equipment journal entry and verify derived status/nextDueDate;
  - archive parent and prove new journal/standard mutations are rejected while history remains readable;
  - source/browser audit that no standalone standards list or standard journal remains in `/equipment`.
- Verifier:
  - run one fresh verifier after implementation;
  - verifier may write only verification artifacts and must not edit production code;
  - `feature_list.json` entry `stage03-equipment-diagnostic-equipment-correction` remains `passes: false` until verifier returns `PASS`.

## File / Module Ownership

- `apps/backend/internal/equipment/**`
- `apps/backend/migrations/**`
- `apps/backend/docs/swagger/**`
- `apps/web/app/(runtime)/equipment/page.tsx`
- `apps/web/app/api/equipment/**`
- `apps/web/features/Stage03Equipment/**`
- `apps/web/shared/api/equipment.ts`
- `apps/web/shared/storybook/runtime-fixtures.ts`
- `apps/web/shared/storybook/runtime-api-mock.*`
- `apps/web/stories/equipment/EquipmentRegistryWorkspace.stories.tsx`
- `apps/web/tests/equipment-registries.smoke.spec.ts`
- `docs/roadmap.md`
- `docs/PRD-MVP.md`
- `docs/architecture/identity-master-data.md`
- `docs/architecture/frontend-architecture.md`
- `.agent/stages/03-identity-master-data/**`

## Canonical Doc Targets If Slice Lands

- `docs/architecture/identity-master-data.md`
  - equipment domain source of truth, data ownership, archive/journal behavior, diagrams.
- `docs/architecture/frontend-architecture.md`
  - `/equipment` frontend route/query compatibility and unified workspace boundary.
- `docs/PRD-MVP.md`
  - product-facing scope and exclusions.
- `docs/roadmap.md`
  - Stage 03 acceptance wording and handoff guardrails.
- Swagger/OpenAPI files if backend contract changes.

## Non-Goals

- Stage 04 request creation/detail workflow.
- Contractor execution or contractor-side equipment registries.
- Аршин integration.
- Accredited-organization equipment master data.
- A standalone industry metrology module.
- Replacing the entire `/equipment` route with a new parallel page or reusable component family.
