# Sprint Contract

- Stage ID: 00-harness-and-source-of-truth
- Slice ID: slice-003-fresh-verify-stage00

## Objective

Run the closing verification slice for Stage 00: refresh the raw proof bundle, resolve any remaining documentation alignment, and leave the stage in a final PASS state ready for Stage 01 handoff.

## Acceptance criteria

- Raw proof artifacts are refreshed from the current repo state for harness runtime, stage directories, git status/log, doc inventory, bootstrap-reference audit, and blocked backend smoke commands.
- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 00-harness-and-source-of-truth` returns `PASS`.
- Canonical docs changed in this branch are aligned with the final Stage 00 decisions, including UI source-of-truth links and documentation-workflow guidance.
- `stage00-fresh-verifier-pass` is marked as proven in `feature_list.json`.
- `verdict.json` records `PASS` and `problems.md` has no blocking issues.
- `progress.md` closes Stage 00 and points the next handoff at Stage 01 `slice-001-storybook-scaffold-and-foundations`.

## File / module ownership

- `AGENTS.md`
- `README.md`
- `docs/design/ui-workflow.md`
- `docs/architecture/documentation-workflow.md`
- `.agent/stages/`

## Build / test plan

- Re-run the runtime harness self-check and capture the JSON output into `raw/harness-runtime-check.json`.
- Refresh stage directory, git status/log, doc inventory, and bootstrap-reference audit outputs under `raw/`.
- Reproduce the blocked backend smoke commands to keep the environment limitation current in evidence.
- Review the canonical docs touched by Stage 00 and close any remaining documentation drift before recording the verdict.
- Re-run the Stage 00 verification review after artifact updates.

## Proof requirements

- current raw runtime harness output
- current stage directory inventory
- current git status and recent git log for the closing proof bundle
- explicit list of canonical docs updated by Stage 00 and any diagram refs added during doc-sync
- backend smoke command outputs or explicit environment failure logs
- updated `feature_list.json`, `progress.md`, `evidence.md`, `evidence.json`, `verdict.json`, and `problems.md`

## Non-goals

- no product feature delivery beyond Stage 00 closure;
- no backend schema/status migration in this slice;
- no return of bootstrap materials into active runtime workflow;
- no silent documentation drift left behind in canonical docs.
