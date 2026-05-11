# Sprint Contract

- Stage ID: `03-identity-master-data`
- Slice ID: `slice-011-input-help-tooltip`
- Status: `PENDING` until implementation evidence and one fresh verifier `PASS`

## Objective

Reduce visual clutter in Stage 03 forms by changing the shared `InputField` hint behavior: non-error `hint` copy must no longer render as always-visible helper text under the field. The same hint content must remain available as hover/focus-accessible auxiliary help in the field label/control area.

The motivating runtime example is the organization profile `КПП` field in `/company`, where `hint="9 цифр."` currently renders below the input. After this slice, that copy should be available through the field help affordance, while validation errors still render visibly under the field.

Do not widen this slice into redesigning `/company`, changing validation rules, changing requisites persistence, or introducing a new form component family.

## Frozen Decisions

- Keep the existing shared `InputField` and its public `hint?: string` prop; this is an `extend` slice, not a component replacement.
- `hint` means auxiliary field help, not persistent below-field helper copy.
- `error` remains a visible below-field message and keeps priority over hint in the visual error area.
- The field remains accessible:
  - pointer hover and keyboard focus expose the hint through a compact help affordance in the label/control area;
  - the hint content remains programmatically associated with the field or the help trigger;
  - `aria-invalid` and error announcement behavior are preserved.
- The help affordance should use the existing UI stack and design tokens. Prefer a small extension inside `InputField`; create a net-new reusable tooltip/help component only if lookup proves no safe extension path and then follow the full Storybook/backlog rules.
- No backend, API, database, or business validation contract changes are in scope.

## Acceptance Criteria

- Shared component behavior:
  - `apps/web/shared/ui/InputField.tsx` no longer renders non-error `hint` as an always-visible text row under the input.
  - When `hint` is present and `error` is absent, the visible form footprint remains the label/control row plus input; the hint is reachable by hover and keyboard focus in the label/control area.
  - When `error` is present, the error remains visible below the field, uses the existing destructive styling, and is announced as before.
  - If both `hint` and `error` are provided, the error remains visible and the hint remains available as auxiliary help without replacing the error.
  - Disabled fields and password fields keep their existing disabled/password-toggle behavior.
- Runtime example:
  - In `/company` organization profile, requisites hints such as `КПП` `9 цифр.` and INN/OGRN hints no longer appear as persistent helper rows under each field.
  - Invalid requisite values still show field-level validation errors below the relevant input.
  - No `/company` data payload, validation length, legal-form, logo, division, unit, access, contract, or equipment behavior changes.
- Storybook:
  - Update `apps/web/stories/primitives/InputField.stories.tsx` so `WithHint` proves the hover/focus help behavior.
  - Keep or add story coverage for error behavior so a verifier can distinguish hint help from visible errors.
  - Do not create a parallel `HelpInput`, `TooltipInput`, or similar component family.

## Proof Requirements

- Harness:
  - `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data`
- Component lookup and UI workflow:
  - run `python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "InputField hint helper help tooltip"`;
  - record the matched `Primitives/InputField` story/source and the `extend` decision in evidence;
  - use `$vrk-web-ui-workflow`;
  - run `$web-design-guidelines` on touched UI files and close or explicitly document findings.
- Web checks:
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run lint`;
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run typecheck`;
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run build`;
  - `cd apps/web && env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm run build-storybook`.
- Focused proof:
  - DOM or browser proof that `WithHint` does not expose the hint as persistent below-field text, but does expose it on hover/focus;
  - focused `/company` proof against the existing runtime stack if available at `http://localhost:3100`, or a documented skip if the stack is unavailable and the user did not ask to start a dev server;
  - proof that an invalid `КПП` still renders a visible field error below the input.
- Verifier:
  - one fresh verifier must independently reproduce the slice-011 acceptance;
  - verifier must not edit production code;
  - `feature_list.json` entry for this slice remains `passes: false` until that verifier returns `PASS`.

## Mandatory UI Workflow

This slice touches `apps/web/shared/ui`, so the reuse-first VRK UI workflow is mandatory.

- Design context to read before implementation:
  - `.impeccable.md`
  - `docs/design/ui-workflow.md`
  - `docs/design/serviceops-design-system.md`
  - `docs/architecture/frontend-architecture.md`
  - `docs/design/storybook-component-backlog.md`
- Component lookup target:
  - `InputField hint helper help tooltip`
- Expected lookup result:
  - `Primitives/InputField [InputField]`
  - story: `apps/web/stories/primitives/InputField.stories.tsx`
  - source: `apps/web/shared/ui/InputField.tsx`
  - relevant stories already include `WithHint` and `WithError`.
- Expected reuse strategy:
  - `extend` the existing `InputField`;
  - update the existing InputField stories;
  - use the existing label/input/error API shape;
  - do not create a new reusable input family;
  - create a separate reusable tooltip/help primitive only if implementation proves the local extension is unsafe, and then add stories plus the required backlog update.

## File / Module Ownership

- `apps/web/shared/ui/InputField.tsx`
- `apps/web/stories/primitives/InputField.stories.tsx`
- `/company` form consumers only for minimal integration fixes if the shared component extension requires usage adjustments:
  - `apps/web/app/(runtime)/company/_components/CompanyStructureWorkspace.tsx`
- `apps/web/shared/ui/index.ts` only if a justified reusable help/tooltip export is introduced
- `apps/web/package.json` and `pnpm-lock.yaml` only if a justified existing-stack tooltip dependency is added
- `.agent/stages/03-identity-master-data/**` for evidence, verifier outputs, and proof notes

## Canonical Doc Targets If Slice Lands

- `docs/design/storybook-component-backlog.md`
  - narrow update likely needed for `UI-03 InputField` if the implemented contract formalizes `hint` as hover/focus help instead of inline helper text;
  - no new component backlog family is expected because this should extend existing `InputField`.
- `docs/design/serviceops-design-system.md`
  - update only if implementation changes the general field/help/error rules beyond this `InputField` contract.
- `docs/architecture/frontend-architecture.md`
  - no update expected unless implementation introduces a new reusable tooltip primitive, dependency policy, or broader UI architecture decision.
- No `docs/roadmap.md`, API, Swagger, or backend docs update is expected for this UI-only clutter/accessibility slice.

## Non-Goals

- Reworking organization profile layout, requisites validation, legal-form behavior, logo upload, division/unit forms, employees, contracts, equipment, or metrology registries;
- changing backend APIs, database schema, OpenAPI/Swagger, seeds, or runtime auth/session behavior;
- adding Stage 04 request flows or any post-MVP form-builder/help-center behavior;
- replacing `SelectField` or `TextareaField` hint contracts in this slice unless a direct regression is introduced by shared helpers;
- starting an ad-hoc dev server without an explicit user request.
