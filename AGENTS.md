# AGENTS.md

<!-- BEGIN VRK MVP STAGE ORCHESTRATOR -->
Use the repo-local VRK stage harness for roadmap execution.

Core rules:
- roadmap source of truth: docs/roadmap.md
- durable stage artifacts: .agent/stages/<stage-id>/
- one top-level stage orchestrator per stage run
- bounded leaf subagents only
- one integration builder owns implementation + evidence
- every verify pass must use a fresh verifier
- verifier must not edit production code
- do not mark features or stages done without proof
<!-- END VRK MVP STAGE ORCHESTRATOR -->

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
