---
name: vrk-mvp-stage-orchestrator
description: Repository-scoped workflow skill for executing one VRK roadmap MVP stage with a top-level Codex orchestrator, durable stage artifacts, bounded same-model subagents, and mandatory fresh verification.
---

# VRK MVP Stage Orchestrator

Use this skill when the user wants Codex to execute **one roadmap stage** of VRK Platform autonomously, with explicit handoff artifacts and a proof-first loop.

This skill is optimized for:

- long-running stage delivery
- fresh-context resumes
- bounded delegation
- evidence-driven completion
- strict MVP scope control

Do **not** use this skill for tiny edits, one-file docs tweaks, or throwaway experiments. Use it when the work should leave a durable repo-local record under `.agent/stages/<stage-id>/`.

## Installation and repo layout

This is a **repository-scoped** skill. Install it under:

```text
.agents/skills/vrk-mvp-stage-orchestrator/
```

This skill expects:

```text
.agent/stages/<stage-id>/
.codex/agents/
AGENTS.md
```

The harness is already installed in this repository. Bootstrap materials used to install or reseed it are archived under `docs/archive/agent-bootstrap/` and are not part of the default runtime workflow.

## Commands supported by this skill

Treat the following phrases as commands when the user invokes this skill:

- `run-stage <stage-id>`
- `resume-stage <stage-id>`
- `verify-stage <stage-id>`
- `close-stage <stage-id>`
- `stage-status <stage-id>`

If no command is supplied, infer the next step from repo state:

1. if the stage spec is missing or stale, do `run-stage`
2. if the stage exists and has an unfinished verifier cycle, do `resume-stage`
3. if the user asks for proof only, do `verify-stage`
4. if the repo-level harness files are missing, inspect `docs/archive/agent-bootstrap/` before attempting a manual restore

## Required model and delegation policy

For this workflow, use the same model for the top-level stage run and every custom subagent:

- `model = "gpt-5.4"`
- `model_reasoning_effort = "xhigh"`

Do **not** optimize for token savings. Optimize for correctness, durability, and autonomy.

Still keep the system disciplined:

- shallow tree only
- the top-level stage run is the **only orchestrator**
- child agents are **leaf roles**
- no recursive child orchestration
- bounded wave-based fan-out
- one fresh verifier per verify pass

## Stage artifact contract

Each stage lives under:

```text
.agent/stages/<stage-id>/
```

Minimum files:

- `stage_spec.md`
- `feature_list.json`
- `progress.md`
- `sprint_contract.md`
- `evidence.md`
- `evidence.json`
- `verdict.json`
- `problems.md`
- `raw/`

These files are the source of truth for cross-session handoff. Session-local todo UI is helpful but never authoritative.

## Top-level workflow

### 1. Re-sync at the start of every stage session

Before making changes:

1. read `AGENTS.md`
2. read the relevant section of `docs/roadmap.md`
3. read `.agent/stages/<stage-id>/progress.md`
4. read `.agent/stages/<stage-id>/feature_list.json`
5. read recent `git log`
6. start the app or dev stack if available
7. run smoke checks before new implementation

Do not start coding until you understand the current repo state.

### 2. Freeze the stage spec before implementation

If the stage spec is missing, stale, or ambiguous:

- optionally spawn up to **3 read-only explorers**
- spawn exactly **1 spec freezer**
- update:
  - `stage_spec.md`
  - `feature_list.json`
  - `sprint_contract.md`

The spec freezer reduces ambiguity. It must not silently expand MVP scope.

### 3. Implement one sprint contract at a time

After the spec is frozen:

- spawn exactly **1 builder** as the integration owner
- optionally use up to **3 workers** only if ownership splits cleanly
- every worker must get explicit path/module ownership
- the builder remains the single owner of:
  - integration logic
  - evidence bundle composition
  - final stage slice coherence

The parent stage orchestrator owns phase transitions. The builder does not become a second orchestrator.

If the sprint contract touches `apps/web` or any frontend/UI path:

- the builder must invoke `$vrk-web-ui-workflow`
- shared design context must come from `.impeccable.md`
- the builder must use `$impeccable craft` and `$polish` as the primary UI workflow
- `frontend-design` may be used only as an explicit fallback if Impeccable is unavailable or broken

### 4. Evidence is mandatory

After implementation for the current sprint contract:

- gather commands run
- store test outputs in `raw/`
- record screenshots if UI behavior matters
- update `evidence.md`
- update `evidence.json`

For web UI slices also record:

- prompt or brief source
- changed UI files
- result of `$web-design-guidelines`
- brief note on how findings were closed if any were reported

Never mark a feature as done based on code inspection alone.

### 5. Fresh verification is mandatory

For each verification pass:

- spawn exactly **1 fresh verifier**
- the verifier may write only verification artifacts
- the verifier must not edit production code
- the verifier writes:
  - `verdict.json`
  - `problems.md` if not `PASS`

For web UI slices the verifier must also rerun or reproduce the `$web-design-guidelines` gate and treat unresolved findings as proof gaps.

Fresh means a new verifier session, not a resumed verifier.

### 6. Fix minimally, then verify again

If the verifier returns a failure:

- spawn exactly **1 fixer**
- apply the smallest safe change set
- refresh evidence
- run a **new fresh verifier**

Repeat until:

- the sprint contract is proven, and
- the stage is either complete or ready for the next sprint contract

### 7. Close each session cleanly

At the end of each session:

- update `progress.md`
- update only truly proven `passes` entries in `feature_list.json`
- leave the repo in a clean mergeable state
- make a descriptive git commit when appropriate

## Hard rules

- Do not declare the stage done early.
- Do not mark features as passing without proof.
- Do not let child agents recursively orchestrate.
- Do not let workers write `verdict.json` or own evidence.
- Do not let the verifier edit production code.
- Do not expand scope beyond roadmap MVP guardrails.
- Do not skip smoke tests on resumed sessions when app startup is available.
- Do not use `$frontend-design` directly when Impeccable is available for the same UI task.

## Subagent roster

The active project-scoped agents live in `.codex/agents/`:

- `vrk_stage_explorer`
- `vrk_stage_spec_freezer`
- `vrk_stage_builder`
- `vrk_stage_verifier`
- `vrk_stage_fixer`

All of them should use `gpt-5.4` with `xhigh` reasoning.

Role details live in:

- `references/PROTOCOL.md`
- `references/ARTIFACTS.md`
- `references/SUBAGENTS.md`

## Archived bootstrap bundle

Bootstrap-only materials are archived under:

```text
docs/archive/agent-bootstrap/
```

Use the archive only for manual recovery or historical reference. Normal stage execution should use the already-installed runtime under `.codex/agents/`, `.agent/stages/`, `AGENTS.md`, and `docs/roadmap.md`.

## Recommended parent prompt for a stage

```text
Use $vrk-mvp-stage-orchestrator to run stage <stage-id> from docs/roadmap.md.

You are the top-level stage orchestrator.
Re-sync with AGENTS.md, docs/roadmap.md, stage artifacts, git log, and smoke tests.
Freeze the stage spec before implementation.
Work one sprint contract at a time.
Use bounded leaf subagents only when they reduce risk.
Keep one builder as the integration owner.
Require fresh verification for every verify pass.
Do not mark anything done without proof.
```
