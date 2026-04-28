# codex_skill_creation_prompt.md

Ниже — готовый промпт для Codex, который просит его **создать/обновить repo-scoped skill** для stage-based автономной разработки VRK Platform.

> Рекомендуемый способ запуска: в корне репозитория вызвать встроенный creator и сразу дать ему этот текст.  
> То есть сначала ` $skill-creator `, затем вставить весь промпт ниже.  
> Если удобнее — можно просто вставить этот текст в обычную Codex-сессию и явно попросить создать skill вручную.

---

```text
Create or update a repository-scoped Codex skill named `vrk-mvp-stage-orchestrator` under:

.agents/skills/vrk-mvp-stage-orchestrator/

This must be a script-backed skill, not an instruction-only toy. The skill is for autonomous stage-by-stage delivery of `VRK Platform` from docs/roadmap.md.

Primary objective
Build a repo-local harness where each roadmap stage is executed by one top-level Codex stage orchestrator. That top-level orchestrator may spawn bounded leaf subagents for research, spec freezing, implementation, fixing, and fresh verification.

Critical requirements
1. Every stage run is a separate top-level agent session.
2. The top-level stage agent is the only orchestrator.
3. All subagents are leaf roles. Do not let subagents recursively orchestrate other subagents.
4. Use the same model for the main stage run and every custom subagent:
   - model = gpt-5.5
   - model_reasoning_effort = xhigh
5. Do not optimize for token savings. Optimize for correctness, durable handoff, and autonomous completion.
6. Still keep orchestration disciplined:
   - max_depth = 1
   - shallow task tree
   - bounded wave-based fan-out
7. Fresh verification is mandatory:
   - every verifier pass must run in a fresh verifier session
   - verifier must not edit production code
8. Builder/integration owner is the single owner of the implementation merge logic and the evidence bundle.
9. Use a structured artifact handoff between sessions and between phases.
10. Do not allow the agent to declare a stage done early.

What the skill must create or manage
1. A `SKILL.md` file with clear trigger boundaries and explicit commands.
2. Helper scripts to bootstrap and inspect stage artifacts.
3. Repo-local stage artifacts under:
   .agent/stages/<stage-id>/
4. Project-scoped custom subagents under:
   .codex/agents/
5. Optional config snippet for:
   .codex/config.toml
6. A managed workflow block for repo-root `AGENTS.md`.
7. A repo-level documentation workflow source of truth under:
   docs/architecture/documentation-workflow.md

Stage artifact contract
For each stage create and maintain:
- stage_spec.md
- feature_list.json
- progress.md
- sprint_contract.md
- evidence.md
- evidence.json
- verdict.json
- problems.md
- raw/

Behavioral contract of the harness
A stage run must follow this loop:
1. re-sync context from:
   - AGENTS.md
   - docs/architecture/documentation-workflow.md
   - docs/roadmap.md
   - .agent/stages/<stage-id>/progress.md
   - .agent/stages/<stage-id>/feature_list.json
   - git log
   - smoke tests / init scripts
2. freeze the stage spec
3. create or update a structured feature list JSON
4. choose exactly one sprint contract
5. implement that sprint contract
6. pack evidence
7. sync canonical docs and diagrams for decisions made in the slice
8. run a fresh verifier
9. if FAIL:
   - write verdict.json
   - write problems.md
   - apply the smallest safe fix set
   - refresh docs if the proof gap is documentation drift
   - refresh evidence
   - rerun a fresh verifier
10. update progress
11. commit
12. continue until the stage definition of done is proven

Subagent policy
Create project-scoped custom subagents for these roles:
- vrk_stage_explorer
- vrk_stage_spec_freezer
- vrk_stage_builder
- vrk_stage_verifier
- vrk_stage_fixer

All of them must use:
- gpt-5.5
- xhigh reasoning

Role rules
- Explorer:
  - read-only
  - answers one narrow question
  - returns findings, risks, and suggested contract criteria
- Spec freezer:
  - writes stage_spec.md, feature_list.json, sprint_contract.md
  - must reduce ambiguity, not expand scope
- Builder:
  - owns the main implementation
  - may receive help from bounded workers only if file ownership is explicit
  - owns evidence pack
  - syncs canonical docs when the slice changes documented behavior or decisions
- Verifier:
  - fresh session every time
  - may write only verification artifacts
  - must not edit production code
  - treats material documentation drift as a proof gap
- Fixer:
  - applies the smallest safe change set from problems.md
  - does not rewrite unrelated code

Bounded fan-out rules
- Before spec freeze:
  - up to 3 read-only explorers if ambiguity remains
- After spec freeze:
  - exactly 1 integration builder
  - optionally up to 3 workers if implementation splits cleanly into disjoint ownership
- For proof probes:
  - optionally up to 3 read-only explorers
- For every verification pass:
  - exactly 1 fresh verifier
- Keep the tree shallow and wave-based

Best-practice requirements to encode
- Fresh context beats giant persistent context
- Structured handoff artifacts beat implicit memory
- One feature slice at a time
- Never mark tests/features as passing without proof
- Do not leave material documentation drift unresolved
- Start each resumed session by reading progress, feature list, and git log
- Run smoke checks before starting new implementation
- End each session in a clean mergeable state
- Keep roadmap scope guardrails strict:
  - no legal-significant e-signature
  - no deep metrology platform
  - no multi-contractor per request
  - no multi-work-type request
  - no full ERP replacement
  - no corporate website/billing in this repo-level MVP harness

Files the skill package should include
- SKILL.md
- references/PROTOCOL.md
- references/ARTIFACTS.md
- references/SUBAGENTS.md
- scripts/bootstrap_stage.py
- assets/agents/*.toml
- assets/templates/*.md
- assets/templates/feature_list.json
- assets/config.toml.example

Implementation detail expectations
- Use repository-scoped skill layout recognized by Codex
- Use a managed AGENTS block with begin/end markers
- Use JSON for feature_list.json because the agent is less likely to corrupt it than free-form markdown
- Provide a bootstrap command that can:
  - install subagents into .codex/agents/
  - create stage folders
  - seed required templates
  - append/update AGENTS.md workflow block safely
- Provide a status command that summarizes whether a stage is initialized and which artifacts are stale or missing

Output expectations
When you create/update the skill:
1. create the full file tree
2. show the resulting tree
3. explain how to install/use it in this repository
4. give one ready-to-run command/prompt for Stage 00
5. do not stop after a partial draft; produce the actual files

Use docs/roadmap.md as the operational source of truth for stage IDs and delivery order.
```
