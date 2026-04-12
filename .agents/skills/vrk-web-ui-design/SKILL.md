---
name: vrk-web-ui-design
description: Standalone VRK web UI design skill for components, pages, dashboards, cabinets, onboarding flows, empty states, and UI refactors. Use when Codex needs to design or implement a VRK frontend surface outside the stage-evidence workflow. This skill combines Impeccable design generation (`$impeccable` and `$polish`) with a mandatory Vercel Web Interface Guidelines review via `$web-design-guidelines`.
---

# VRK Web UI Design

## Overview

Use this skill for direct web UI work in VRK when the task is about designing or building a component or page, not about orchestrating a full roadmap stage. It provides a single design pipeline: shared project context from `.impeccable.md`, generation through Impeccable, refinement through `$polish`, and an обязательный Vercel UI review gate.

## Workflow

### 1. Load VRK design context

Before any design work:

1. read `.impeccable.md`
2. read `docs/design/ui-workflow.md`
3. read the relevant code or UI surface you are changing

If `.impeccable.md` is missing important context, run `$impeccable teach` first and update the shared context file.

### 2. Keep the VRK tone consistent

Default tone for VRK UI:

- industrial
- utilitarian
- high-clarity B2B
- operator-focused
- calm, dense, and trustworthy

Avoid:

- playful consumer SaaS patterns
- glassmorphism
- generic card-on-card dashboards
- decorative gradients, glows, and “AI slop” styling
- ornamental motion that does not clarify behavior

### 3. Build through Impeccable

Choose the right path:

- use `$impeccable craft` for net-new components, pages, and substantial redesigns
- use `$polish` for final cleanup and consistency
- use `$impeccable extract` only when the task is explicitly about extracting reusable UI patterns or tokens

Always include task-specific input in the prompt:

- what surface is being built
- who uses it
- what job they need to complete
- what states must be visible
- any technical constraints from the codebase

### 4. Run the review gate

After implementation:

1. identify the changed UI files
2. run `$web-design-guidelines` on those files
3. resolve the findings before calling the work finished

Do not stop at “looks good”. The review gate is part of the definition of done.

## Hard Rules

- Do not use `frontend-design` directly when `Impeccable` is available.
- Use `frontend-design` only as a fallback if `Impeccable` is unavailable or broken.
- Do not skip `.impeccable.md`.
- Do not skip `$web-design-guidelines`.
- Do not claim completion from taste alone; completion requires a review pass.

## When To Use The Other Skill Instead

If the task is part of a roadmap stage and needs evidence/proof integration with `.agent/stages/...`, use `$vrk-web-ui-workflow` instead. That skill adds stage-aware evidence requirements on top of the same design/review pipeline.

## References

- `references/upstream.md`
- `docs/design/ui-workflow.md`
- `.agents/skills/vendor/impeccable/SKILL.md`
- `.agents/skills/vendor/polish/SKILL.md`
