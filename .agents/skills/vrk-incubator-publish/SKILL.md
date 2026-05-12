---
name: vrk-incubator-publish
description: Publish VRK repository changes to the Incubator branch through a ready GitHub PR, guard against duplicate squash-merged diffs, monitor CI/deploy workflows, and verify the deployed Incubator runtime.
---

# VRK Incubator Publish

Use this repository-scoped skill when the user asks to publish, merge, deploy, or verify current VRK changes in the `Incubator` branch.

This skill is optimized for the fragile handoff after a stage or follow-up slice is already implemented. It complements `$vrk-mvp-stage-orchestrator`; it does not replace stage evidence or fresh verification.

## Defaults

- Repository: `vrk-app/vrk`
- Base branch: `Incubator`
- Branch prefix: `codex/`
- Merge method: squash merge
- Required PR state: ready for review, not draft
- Required PR check: `platform-baseline`
- Required post-merge workflows: `platform-baseline`, `incubator-deploy`
- Runtime proof endpoints:
  - backend `/healthz`
  - backend `/readyz`
  - web `/login`
  - web `/storybook/index.html`
  - web `/storybook/index.json`

## Workflow

1. Read `AGENTS.md` and `docs/architecture/yandex-cloud-incubator-deployment.md`.
2. Inspect `git status --short --branch`. Treat existing dirty files as user work unless the user explicitly told you to publish all non-ignored changes.
3. If the current branch already backed a squash-merged PR, create a new `codex/...` branch and rebase only post-merge work onto `origin/Incubator`.
4. Run preflight before opening the PR:

   ```text
   .agents/skills/vrk-incubator-publish/scripts/preflight.sh
   .agents/skills/vrk-incubator-publish/scripts/diff_guard.sh origin/Incubator
   .agents/skills/vrk-incubator-publish/scripts/mdb_preflight.sh
   ```

5. Open a ready PR into `Incubator` with a Conventional Commits title and a concise Russian body.
6. Wait for PR checks:

   ```text
   .agents/skills/vrk-incubator-publish/scripts/watch_pr_checks.sh vrk-app/vrk <pr-number>
   ```

7. Squash-merge the PR and delete the remote feature branch.
8. Wait for push workflows on the new `Incubator` SHA:

   ```text
   .agents/skills/vrk-incubator-publish/scripts/watch_commit_workflows.sh vrk-app/vrk <merge-sha> platform-baseline.yml incubator-deploy.yml
   ```

9. Verify the deployed runtime:

   ```text
   .agents/skills/vrk-incubator-publish/scripts/runtime_health_check.sh
   ```

10. Record publish evidence when this is attached to a stage:

    ```text
    .agent/stages/<stage-id>/publish.json
    ```

## Duplicate diff guard

When the current work continues from a branch that was already squash-merged, do not reuse that branch directly. Use:

```text
git fetch --prune origin
git switch -c codex/<new-followup-branch>
git rebase --onto origin/Incubator origin/<old-squash-merged-branch>
.agents/skills/vrk-incubator-publish/scripts/diff_guard.sh origin/Incubator
```

The guard should pass only when `origin/Incubator` is the merge-base of `HEAD`; otherwise the PR may include old squash-merged history.

## Publish evidence shape

Use compact JSON so the next agent can resume without rereading long logs:

```json
{
  "base_branch": "Incubator",
  "head_branch": "codex/example",
  "pr": 0,
  "merge_sha": "",
  "local_checks": [],
  "pr_checks": [],
  "post_merge_workflows": [],
  "runtime_checks": [],
  "infra_notes": []
}
```

Keep detailed logs in `.agent/stages/<stage-id>/raw/` only when they are needed to diagnose a failure.

## Failure handling

- If `mdb_preflight.sh` reports a stopped or expiring database, fix the Yandex Cloud state before merging unless the user explicitly accepts deploy risk.
- If a PR check fails, inspect the failing GitHub Actions job logs and make the smallest fix on the same branch.
- If post-merge deploy fails, treat `Incubator` as red: inspect logs, fix via a new PR, merge only after checks pass, then rerun deploy verification.
- Do not start ad-hoc local dev servers while using this skill unless the user explicitly asks for one.
