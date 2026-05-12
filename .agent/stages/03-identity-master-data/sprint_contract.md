# Sprint Contract

- Stage ID: `03-identity-master-data`
- Slice ID: `technical-equipment-operation-journal`
- Frozen at: `2026-05-12`
- Status: `PENDING` until implementation evidence and one fresh verifier `PASS`

## Objective

Correct the Stage 03 equipment journal parity gap without widening the MVP: `/equipment` remains the single customer equipment workspace, and the user-facing journal `Журнал операций по оборудованию` works for both technical equipment and diagnostic equipment / `СИ`.

This slice must not reopen the already-proven owned-standards correction, private photo work, contracts, Stage 04 request flow, contractor-side metrology, or a separate industry metrology module.

## Frozen Decisions

- Public route stays `/equipment`.
- User-facing workspace remains unified:
  - equipment cards/list for technical equipment and diagnostic equipment / `СИ`;
  - journal surface `Журнал операций по оборудованию`;
  - no standalone standards registry in target UI;
  - no standard journal in target UI.
- `registry_metrology_journal_entries` keeps its legacy table name.
- `registry_metrology_journal_entries.subject_type` must support technical equipment by adding `technical_equipment`.
- Diagnostic equipment / `СИ` journal behavior remains supported; implementation may keep the existing legacy diagnostic subject value only as storage/API compatibility, but UI copy must stay diagnostic-equipment based.
- Journal entries are scoped to the selected equipment subject. Standards/setup measures are not selectable journal subjects in the target UI.
- Technical equipment journal List/Create must require the equipment record to be inside the user's visible customer scope.
- Journal mutation requires `manage_equipment`.
- Archived technical or diagnostic equipment rejects new journal mutations, while existing journal history remains readable.
- Current `status` and `nextDueDate` for technical and diagnostic equipment derive from the latest applicable journal entry for that same equipment subject.
- If an equipment record has no applicable journal history, `status` and `nextDueDate` fall back to the card/persisted fields so existing no-history data remains visible.

## Acceptance Criteria

- `/equipment` still renders one workspace, not separate equipment/metrology modules.
- The journal heading is exactly `Журнал операций по оборудованию`.
- The journal subject selector/list includes technical equipment and diagnostic equipment / `СИ`.
- The journal subject selector/list does not include standards/setup measures as journal subjects.
- Standard journals remain absent from the `/equipment` target UI.
- Creating a technical equipment journal entry persists a row in `registry_metrology_journal_entries` with `subject_type = 'technical_equipment'`.
- Listing technical equipment journal entries returns only entries for visible-scope technical equipment.
- Creating technical equipment journal entries is rejected without `manage_equipment`.
- Creating technical equipment journal entries is rejected for equipment outside the user's visible scope.
- Creating technical equipment journal entries is rejected for archived equipment with a clear 4xx response.
- Archived equipment journal history remains readable for users who can see the equipment.
- Diagnostic equipment / `СИ` journal List/Create behavior still works after the technical-equipment addition.
- Technical equipment status and next due date are derived from its latest applicable journal entry when history exists.
- Diagnostic equipment / `СИ` status and next due date are derived from its latest applicable journal entry when history exists.
- Technical and diagnostic equipment with no applicable journal history keep their card/persisted status and next due date fallback.
- Existing `/equipment` old-tab compatibility behavior remains intact.
- Contractor sessions still do not receive the customer equipment registry.

## API / Persistence Targets

- Add or expose technical equipment journal routes:
  - `GET /api/v1/equipment/{equipmentId}/journals`;
  - `POST /api/v1/equipment/{equipmentId}/journals`.
- Preserve diagnostic equipment / `СИ` journal routes or equivalent compatibility:
  - `GET /api/v1/measuring-instruments/{measuringInstrumentId}/journals`;
  - `POST /api/v1/measuring-instruments/{measuringInstrumentId}/journals`.
- Add matching Next.js proxy routes for technical equipment under `apps/web/app/api/equipment/[equipmentId]/journals/`.
- If a generic journal API is used instead of subject-specific handlers, Swagger/OpenAPI must still make technical versus diagnostic subject validation explicit.
- Migration must alter the journal subject check/validation to include `technical_equipment` without renaming `registry_metrology_journal_entries`.
- Backend derivation must ignore standard journal subjects for target equipment-card status unless a legacy migration explicitly rewrites them to equipment-subject history.

## UI Workflow And Reuse

- Use `$vrk-web-ui-workflow` before UI edits.
- Component lookup target:
  - `python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "equipment registry operation journal technical diagnostic journal status"`
- Expected reuse strategy: `extend` existing `Equipment/EquipmentRegistryWorkspace` and the current equipment journal surface.
- Do not create a parallel `/equipment` route, a new reusable workspace family, or a separate metrology UI family unless lookup proves no viable extension path.
- Record lookup result, reuse decision, changed UI files, and `$web-design-guidelines` result in evidence.
- Storybook must cover:
  - technical equipment with journal history;
  - technical equipment without journal history fallback;
  - diagnostic equipment / `СИ` with journal history;
  - archived equipment with read-only journal history;
  - read-only scoped user with visible journal history;
  - mutation rejection/error state for archived or unauthorized journal create.

## Proof Requirements

- Harness / stage artifacts:
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
  - `jq empty .agent/stages/03-identity-master-data/evidence.json .agent/stages/03-identity-master-data/feature_list.json .agent/stages/03-identity-master-data/verdict.json`
- Backend checks if backend/API/persistence changes:
  - gofmt on touched Go files;
  - backend tests;
  - backend build;
  - migration proof for `technical_equipment` subject acceptance;
  - Swagger/OpenAPI refresh if annotations or schema changed.
- Web checks:
  - web lint;
  - web typecheck;
  - web build;
  - Storybook build.
- Targeted proof:
  - create or seed technical equipment;
  - create technical journal entry through the API/UI path;
  - prove technical status/nextDueDate derives from latest journal entry;
  - prove fallback status/nextDueDate when no journal history exists;
  - prove diagnostic equipment / `СИ` journal still works;
  - prove archived technical/diagnostic equipment rejects new journal entries but preserves readable history;
  - prove standard journal subjects are not visible in `/equipment`.
- Verifier:
  - run one fresh verifier after implementation;
  - verifier may write only verification artifacts and must not edit production code;
  - `feature_list.json` entry `stage03-technical-equipment-operation-journal-parity` remains `passes: false` until verifier returns `PASS`.

## File / Module Ownership

- `apps/backend/internal/equipment/metrologyjournal/**`
- `apps/backend/internal/equipment/equipment/**`
- `apps/backend/internal/equipment/measuringinstrument/**`
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
- `.agent/stages/03-identity-master-data/**`

## Canonical Doc Targets If Slice Lands

- `docs/architecture/identity-master-data.md`
  - journal subject model, legacy table-name decision, scope/mutation rules, status/nextDueDate derivation, and a small Mermaid derivation/data-flow diagram.
- `docs/architecture/frontend-architecture.md`
  - `/equipment` journal route/proxy/UI boundary and old-tab compatibility.
- `docs/PRD-MVP.md`
  - product-facing statement that `Журнал операций по оборудованию` covers technical and diagnostic equipment only.
- `docs/roadmap.md`
  - Stage 03 acceptance wording for technical-equipment journal parity.
- Swagger/OpenAPI files if backend contract changes.
- `docs/design/storybook-component-backlog.md` only if a new reusable component family or backlog gap is introduced.

## Non-Goals

- Stage 04 request creation/detail workflow.
- Contractor metrology equipment.
- Separate industry metrology module.
- Аршин integration.
- Standard journals in target UI.
- Standalone standards CRUD or reusable standards registry.
- Replacing the unified `/equipment` workspace with a parallel page.
