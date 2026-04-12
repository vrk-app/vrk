# Evidence

- Stage ID: 00-harness-and-source-of-truth
- Sprint Contract ID: slice-003-fresh-verify-stage00

## Commands run

- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 00-harness-and-source-of-truth > .agent/stages/00-harness-and-source-of-truth/raw/harness-runtime-check.json`
- `find .agent/stages -maxdepth 1 -mindepth 1 -type d | sort > .agent/stages/00-harness-and-source-of-truth/raw/stage-directories.txt`
- `git status --short --branch > .agent/stages/00-harness-and-source-of-truth/raw/git-status.txt`
- `git log --oneline --decorate -n 12 > .agent/stages/00-harness-and-source-of-truth/raw/git-log.txt`
- `find AGENTS.md README.md CONTRIBUTING.md docs/architecture docs/testing docs/design -type f | sort > .agent/stages/00-harness-and-source-of-truth/raw/doc-inventory.txt`
- `rg -n "docs/archive/agent-bootstrap|bootstrap-install\\.json|roadmap_mvp\\.md" AGENTS.md README.md CONTRIBUTING.md docs .agents .codex .agent/stages/00-harness-and-source-of-truth > .agent/stages/00-harness-and-source-of-truth/raw/bootstrap-reference-audit.txt || true`
- repo inspection commands against `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `docs/roadmap.md`, `docs/architecture/documentation-workflow.md`, `docs/architecture/source-of-truth.md`, `docs/architecture/frontend-architecture.md`, `docs/design/ui-workflow.md`, `docs/onboarding.md`, and `.agent/stages/00-harness-and-source-of-truth/*`
- `go test ./...` in `apps/backend` (blocked: `go` command missing)
- `go build ./...` in `apps/backend` (blocked: `go` command missing)

## Tests run

- Harness runtime self-check: passed
- Stage directory seeding check: passed
- Documentation workflow / canonical doc alignment review: passed
- Active bootstrap-reference audit: passed
- Fresh Stage 00 verifier review: passed
- Document inventory check for architecture/testing/docs coverage: passed
- Backend compile/smoke check: blocked by missing Go toolchain in the current environment

## Canonical docs updated

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `docs/roadmap.md`
- `docs/architecture/documentation-workflow.md`
- `docs/architecture/source-of-truth.md`
- `docs/architecture/frontend-architecture.md`
- `docs/testing/test-strategy.md`
- `docs/design/ui-workflow.md`
- `docs/design/storybook-component-backlog.md`
- `docs/onboarding.md`

## Decisions verified

- Stage 00 proof uses the active repo-local runtime harness and `verify_harness.py`; archived bootstrap materials remain provenance/recovery only.
- Documentation sync is a repo-level requirement and verifier proof-gap rule, not optional follow-up cleanup.
- `docs/architecture/frontend-architecture.md` is part of the UI source-of-truth stack for future `apps/web` work and is now referenced consistently from repo guidance.
- Onboarding for the current runnable baseline lives in `docs/onboarding.md`, replacing the removed `docs/quickstart-local-setup.md`.

## Diagram refs

- `docs/architecture/documentation-workflow.md` - Mermaid flowchart for the doc-sync loop inside the stage workflow.
- `docs/architecture/frontend-architecture.md` - Mermaid dependency graph for the target `apps/web` layered architecture.

## Artifacts collected

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `docs/roadmap.md`
- `docs/architecture/documentation-workflow.md`
- `docs/architecture/source-of-truth.md`
- `docs/architecture/frontend-architecture.md`
- `docs/architecture/adr/0001-stack-boundaries.md`
- `docs/architecture/adr/0002-mvp-scope-guardrails.md`
- `docs/architecture/adr/0003-request-status-model.md`
- `docs/architecture/adr/0004-offline-sync-approach.md`
- `docs/testing/test-strategy.md`
- `docs/design/ui-workflow.md`
- `docs/design/storybook-component-backlog.md`
- `docs/onboarding.md`
- `.impeccable.md`
- `.agents/skills/vrk-web-ui-design/`
- `.agents/skills/vrk-web-ui-workflow/`
- `.agents/skills/vendor/impeccable/`
- `.agents/skills/vendor/polish/`
- `.agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py`
- `docs/archive/agent-bootstrap/`
- `.agent/stages/01-ui-storybook-foundation/`
- `.agent/stages/00-harness-and-source-of-truth/raw/harness-runtime-check.json`
- `.agent/stages/00-harness-and-source-of-truth/raw/stage-directories.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/doc-inventory.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/bootstrap-reference-audit.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/bootstrap-install.json`
- `.agent/stages/00-harness-and-source-of-truth/raw/backend-go-test.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/backend-go-build.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/git-status.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/git-log.txt`

## Criteria mapping

- `stage00-harness-installed`: `AGENTS.md`, `.codex/config.toml`, `.codex/agents/`, `.agents/skills/vrk-mvp-stage-orchestrator/`, `raw/harness-runtime-check.json`
- `stage00-stage-directories-seeded`: `.agent/stages/`, `raw/stage-directories.txt`, `raw/harness-runtime-check.json`
- `stage00-source-of-truth-frozen`: `docs/architecture/source-of-truth.md`, `raw/doc-inventory.txt`
- `stage00-adrs-frozen`: `docs/architecture/adr/0001-stack-boundaries.md`, `docs/architecture/adr/0002-mvp-scope-guardrails.md`, `docs/architecture/adr/0003-request-status-model.md`, `docs/architecture/adr/0004-offline-sync-approach.md`
- `stage00-test-strategy-baseline`: `docs/testing/test-strategy.md`, `raw/backend-go-test.txt`, `raw/backend-go-build.txt`
- `stage00-storybook-backlog-integrated`: `docs/design/storybook-component-backlog.md`, `AGENTS.md`, `docs/design/ui-workflow.md`, `.agent/stages/01-ui-storybook-foundation/`
- `stage00-fresh-verifier-pass`: `raw/harness-runtime-check.json`, `raw/git-status.txt`, `verdict.json`, `problems.md`, `progress.md`

## Notes / limitations

- The current execution environment does not provide `go`, so backend compile/test smoke could not be completed locally.
- `roadmap_mvp.md` previously duplicated the Codex-oriented roadmap text; for agent execution the authoritative file is now `docs/roadmap.md`.
- Storybook backlog integration updates the durable stage map to `00..07`; Stage 00 now closes with this verifier pass and hands off to Stage 01.
- `docs/archive/agent-bootstrap/` and `raw/bootstrap-install.json` are retained only as historical provenance and manual recovery material; they are no longer part of the active runtime proof path.
