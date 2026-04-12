---
name: vrk-web-ui-workflow
description: Unified VRK web UI workflow for generating and reviewing components, pages, dashboards, cabinets, onboarding states, empty states, and UI refactors. Use when Codex needs to design or refine frontend surfaces for VRK. This skill routes design work through Impeccable (`$impeccable` and `$polish`) and requires a Vercel Web Interface Guidelines review pass via `$web-design-guidelines` before a UI slice can be considered done.
---

# VRK Web UI Workflow

## Overview

Use this skill as the single entrypoint for VRK web UI work. It enforces a stable project-specific flow: shared design context in `.impeccable.md`, generation via Impeccable, final refinement via `$polish`, and mandatory review through `$web-design-guidelines`.

## Workflow

### 1. Load project context first

Before any design work:

1. read `.impeccable.md`
2. read `docs/design/ui-workflow.md`
3. if the task is part of a stage run, also read the current `sprint_contract.md` and `evidence.*`

If `.impeccable.md` does not contain enough context, run `$impeccable teach` and update the file before designing anything else.

### 2. Use the canonical VRK design tone

The default VRK tone is fixed:

- industrial
- utilitarian
- high-clarity B2B
- dense but calm operator surfaces
- trust, auditability, and state legibility over decorative flair

Do not drift into:

- consumer SaaS tropes
- glassmorphism
- nested card grids
- decorative gradients and glows
- playful or whimsical visual language

### 3. Generate the UI through Impeccable

Choose the lightest path that matches the task:

- for net-new surfaces or substantial redesigns: run `$impeccable craft`
- for final visual/system cleanup on existing UI: run `$polish`
- if the task needs a design-system extraction step later, use `$impeccable extract`

Pass task-specific context in the prompt:

- which VRK surface is being built
- who the user is
- what operational job they need to complete
- any stage acceptance criteria that must be visible in the UI

### 4. Run the mandatory review gate

After implementation or refinement:

1. identify the changed UI files
2. run `$web-design-guidelines` on those files
3. fix the findings or document a conscious exception

Do not mark the UI slice complete before this gate is closed.

### 5. Record proof for stage-driven work

If the task is part of a roadmap stage, make sure evidence includes:

- prompt or brief source
- changed UI files
- screenshots if they matter
- `$web-design-guidelines` result
- note of how findings were resolved

## Hard Rules

- Do not use `frontend-design` directly when `Impeccable` is available.
- Use `frontend-design` only as a fallback if `Impeccable` is unavailable or broken.
- Do not skip `.impeccable.md`.
- Do not skip `$web-design-guidelines`.
- Do not declare UI work done based only on taste or code inspection.

## References

- `references/upstream.md`
- `.agents/skills/vendor/impeccable/SKILL.md`
- `.agents/skills/vendor/polish/SKILL.md`
- `docs/design/ui-workflow.md`
