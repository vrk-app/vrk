#!/usr/bin/env bash
set -euo pipefail

repo="${1:?usage: watch_pr_checks.sh <owner/repo> <pr-number>}"
pr_number="${2:?usage: watch_pr_checks.sh <owner/repo> <pr-number>}"

gh pr checks "$pr_number" --repo "$repo" --watch --fail-fast
gh pr checks "$pr_number" --repo "$repo"

echo "watch_pr_checks: ok"
