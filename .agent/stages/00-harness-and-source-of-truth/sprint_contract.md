# Sprint Contract

- Stage ID: 00-harness-and-source-of-truth
- Slice ID: slice-001-harness-bootstrap-and-doc-freeze

## Objective

Install and activate the stage harness, freeze Stage 00 source-of-truth documents, and seed the roadmap stage directories so future Codex runs can resume from repo-local artifacts instead of chat history.

## Acceptance criteria

- Harness is installed at repo scope and `.codex/config.toml` is active.
- Stage directories for `00..07` exist.
- `docs/architecture/source-of-truth.md` exists and resolves current repo/PRD/legacy precedence.
- ADRs exist for stack boundaries, MVP scope, request status model, and offline sync.
- `docs/testing/test-strategy.md` exists and records current environment proof gaps.
- `docs/design/storybook-component-backlog.md` exists and is linked from repo-local UI guidance.
- Evidence bundle is updated for this slice.

## File / module ownership

- `AGENTS.md`
- `.agents/skills/vrk-mvp-stage-orchestrator/`
- `.codex/`
- `.agent/stages/`
- `docs/architecture/`
- `docs/testing/`

## Build / test plan

- Run bootstrap install/status commands and capture outputs.
- Verify stage directories with `find .agent/stages`.
- Inspect repo documents and backend structure to freeze source-of-truth and ADR.
- Attempt backend smoke via `go test ./...` and `go build ./...`; if blocked, record the failure as environment evidence.

## Proof requirements

- raw bootstrap output
- stage directory inventory
- created architecture and testing documents
- backend smoke command outputs or explicit environment failure logs
- updated `feature_list.json`, `progress.md`, `evidence.md`, and `evidence.json`

## Non-goals

- no product feature delivery beyond Stage 00 scaffolding;
- no backend schema/status migration in this slice;
- no attempt to mark Stage 00 as closed without a fresh verifier pass.
