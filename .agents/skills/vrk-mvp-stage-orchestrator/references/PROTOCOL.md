# PROTOCOL.md

## Purpose

This file defines the execution protocol for the VRK stage harness.

The protocol combines:

- simple loop execution inspired by Ralph Wiggum style stage progression
- structured handoff artifacts between sessions
- one-slice-at-a-time delivery
- explicit proof before completion
- a single integration owner
- a fresh verifier on every verification pass

## Session start protocol

At the start of every resumed or new stage session:

1. read `AGENTS.md`
2. read `docs/architecture/documentation-workflow.md`
3. read `docs/roadmap.md`
4. read `.agent/stages/<stage-id>/progress.md`
5. read `.agent/stages/<stage-id>/feature_list.json`
6. read recent git history
7. run app startup or `init.sh` equivalent if present
8. run smoke checks before choosing new work

If smoke fails, fix the broken baseline before implementing new functionality.

## Delegation policy

The top-level stage session is the only orchestrator.

### Allowed child roles

- explorer
- spec freezer
- builder
- verifier
- fixer

### Not allowed

- recursive child orchestration
- deep delegation trees
- verifier-led implementation
- builder-led verifier reuse as proof of freshness

## Fan-out policy

### Before spec freeze

Use up to 3 explorers if ambiguity remains high.

Good reasons:

- unclear file ownership
- conflicting product/business rules
- uncertain test strategy
- unclear request workflow mapping

### After spec freeze

Use exactly 1 builder as the integration owner.

Optionally use up to 3 workers only if:

- ownership is disjoint
- merge order is obvious
- the parent can still preserve a single integration narrative

If the slice touches `apps/web` or frontend/UI paths:

- the builder must use `$vrk-web-ui-workflow`
- `.impeccable.md` is the shared design context source
- `$web-design-guidelines` is a required acceptance gate before the slice can be proven

### Verification

Exactly 1 fresh verifier per verify pass.

### Documentation sync

Before verification:

- update canonical docs if the slice changed or clarified a documented decision
- add or refresh diagrams for non-trivial flows and state machines
- record doc changes in evidence

Material documentation drift on the changed slice is a proof gap.

### Proof probes

If needed, use up to 3 read-only explorers for disjoint proof gaps, but the verifier remains the sole verdict owner.

## Stage completion policy

A stage is complete only if all of the following are true:

1. `feature_list.json` has no remaining required features marked failing
2. latest `verdict.json` is `PASS`
3. evidence bundle is current
4. stage output matches roadmap guardrails
5. repo is left in a clean mergeable state

## Clean-state policy

Before ending a session:

- no half-migrated schema work
- no knowingly broken smoke path
- no undocumented local-only assumptions
- no unresolved material documentation drift on the changed slice
- no stale `progress.md`
- no feature marked done without proof
- no unresolved web-design-guidelines findings for proven frontend slices

## Scope guardrails

This harness should keep MVP scope strict. Do not expand into:

- legal-significant electronic signature
- deep metrology platform
- multi-contractor request orchestration
- multi-work-type requests
- full ERP replacement
- corporate site and billing in the product repo
- speculative AI features before MVP proof

## Why this protocol exists

Long-running autonomous coding fails most often when the agent:

- tries to do too much in one shot
- forgets what was already done
- declares victory early
- verifies with the same contaminated context
- leaves broken state for the next session

This protocol exists to eliminate those failure modes.
