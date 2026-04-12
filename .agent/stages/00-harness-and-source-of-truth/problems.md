# Problems

Fresh verifier has not run yet, so this file currently captures open proof gaps rather than verifier-confirmed defects.

## Missing fresh verifier pass

- Criterion: `stage00-fresh-verifier-pass`
- Why not yet proven: this session completed the builder/orchestrator setup and evidence collection, but did not execute a fresh verifier run.
- Expected: a new verifier session validates Stage 00 artifacts and either records `PASS` or enumerates proof gaps.
- Actual: `verdict.json` remains `PENDING`.
- Smallest safe next step: run a fresh verify pass for `00-harness-and-source-of-truth` against the current docs and raw evidence.

## Backend smoke blocked by environment

- Criterion: backend compile/test smoke should be part of the baseline proof bundle before later stages expand the codebase.
- Why not yet proven: the current shell environment does not provide the `go` command.
- Expected: `go test ./...` and `go build ./...` run in `apps/backend`.
- Actual: both commands fail immediately with `command not found: go`.
- Smallest safe next step: install Go locally or use a containerized toolchain before Stage 02 full-stack runtime work begins.
