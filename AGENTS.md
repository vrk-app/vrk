# AGENTS.md

<!-- BEGIN VRK MVP STAGE ORCHESTRATOR -->
Use the repo-local VRK stage harness for roadmap execution.

Core rules:
- roadmap source of truth: docs/roadmap.md
- documentation workflow source of truth: docs/architecture/documentation-workflow.md
- durable stage artifacts: .agent/stages/<stage-id>/
- one top-level stage orchestrator per stage run
- bounded leaf subagents only
- one integration builder owns implementation + evidence
- every verify pass must use a fresh verifier
- verifier must not edit production code
- if implementation or clarified decisions drift from docs, update the canonical docs in the same slice
- close substantial work with doc-sync; keep technical docs readable and add diagrams for non-trivial flows
- do not mark features or stages done without proof
<!-- END VRK MVP STAGE ORCHESTRATOR -->

## Documentation Workflow

Before closing substantial product, architecture, workflow, or integration work, read:

- `docs/architecture/documentation-workflow.md`

Apply these rules:

- If the agent made or clarified a decision that changes documented behavior, architecture, contracts, or operating steps, sync the canonical docs in the same slice.
- Stage artifacts capture handoff and proof, but they do not replace canonical product and technical documentation.
- Prefer updating the narrowest source of truth: ADR/source-of-truth docs for architecture, `docs/design/*` for UI rules, Swagger/OpenAPI for API contract, `README.md` / onboarding docs for setup and runtime behavior.
- Add Mermaid diagrams for non-trivial state machines, request/approval flows, sync flows, orchestration paths, and cross-module interactions.
- Do not leave silent documentation drift behind; if a doc update must be deferred, record the exact gap and reason in the stage artifacts.

## UI Workflow Policy

- For standalone VRK web component/page design tasks, invoke `$vrk-web-ui-design`.
- For `apps/web` and other frontend/UI slices, invoke `$vrk-web-ui-workflow`.
- Primary design generator/refinement path: `$impeccable craft` -> `$polish`.
- Shared design context lives in `.impeccable.md`.
- Mandatory review gate: `$web-design-guidelines`.
- Do not use `$frontend-design` directly when `Impeccable` is available; keep it as fallback only.

## UI Source Of Truth

Before generating or refactoring UI, Storybook stories, layout, forms, tables, charts, and domain UI components, read:

- `docs/design/serviceops-design-system.md`
- `docs/design/ui-workflow.md`
- `docs/architecture/frontend-architecture.md`
- `docs/design/storybook-component-backlog.md` for Storybook/component-library tasks

Use the design-system doc as the canonical source for:

- semantic colors and tokens;
- typography, spacing, radii, borders, and motion;
- B2B data-dense layout patterns;
- component variant expectations and state handling.

## UI Implementation Rules

- Reuse existing UI primitives first; do not invent parallel component families without need.
- Use semantic tokens from `docs/design/serviceops-design-system.md`; do not hardcode raw hex values in JSX/TSX when a semantic token exists.
- Preferred stack for new UI: Tailwind CSS, Radix UI primitives, shadcn/ui-style open code, `class-variance-authority`, and shared `cn()` helpers.
- Prefer `react-hook-form` + `zod` for forms, `@tanstack/react-table` for tables, `recharts` for charts, and `lucide-react` for icons.
- Reusable components must accept `className`, avoid external margins by default, and expose predictable `variant` / `size` / `tone` APIs when relevant.
- Relevant components must cover disabled, loading, empty, and error states, and behave correctly on mobile and desktop.
- Favor incremental alignment with the design system for legacy UI; if a deliberate deviation is required, document it in the change summary or PR.
