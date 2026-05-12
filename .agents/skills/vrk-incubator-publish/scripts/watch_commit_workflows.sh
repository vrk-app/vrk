#!/usr/bin/env bash
set -euo pipefail

repo="${1:?usage: watch_commit_workflows.sh <owner/repo> <commit-sha> [workflow ...]}"
commit_sha="${2:?usage: watch_commit_workflows.sh <owner/repo> <commit-sha> [workflow ...]}"
shift 2

if [ "$#" -eq 0 ]; then
  set -- platform-baseline.yml incubator-deploy.yml
fi

timeout_seconds="${TIMEOUT_SECONDS:-3600}"
interval_seconds="${INTERVAL_SECONDS:-30}"
deadline="$(($(date +%s) + timeout_seconds))"

while :; do
  all_done=1
  for workflow in "$@"; do
    run_id="$(gh run list --repo "$repo" --workflow "$workflow" --commit "$commit_sha" --limit 1 --json databaseId --jq '.[0].databaseId // ""')"
    status="$(gh run list --repo "$repo" --workflow "$workflow" --commit "$commit_sha" --limit 1 --json status --jq '.[0].status // ""')"
    conclusion="$(gh run list --repo "$repo" --workflow "$workflow" --commit "$commit_sha" --limit 1 --json conclusion --jq '.[0].conclusion // ""')"
    url="$(gh run list --repo "$repo" --workflow "$workflow" --commit "$commit_sha" --limit 1 --json url --jq '.[0].url // ""')"

    if [ -z "$run_id" ]; then
      echo "$workflow: waiting for run on $commit_sha"
      all_done=0
      continue
    fi

    echo "$workflow run=$run_id status=$status conclusion=${conclusion:-none} url=$url"

    if [ "$status" = "completed" ] && [ "$conclusion" = "success" ]; then
      continue
    fi
    if [ "$status" = "completed" ]; then
      echo "$workflow failed with conclusion=$conclusion" >&2
      exit 1
    fi
    all_done=0
  done

  if [ "$all_done" -eq 1 ]; then
    echo "watch_commit_workflows: ok"
    exit 0
  fi

  if [ "$(date +%s)" -ge "$deadline" ]; then
    echo "watch_commit_workflows: timed out" >&2
    exit 1
  fi

  sleep "$interval_seconds"
done
