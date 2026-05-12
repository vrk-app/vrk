#!/usr/bin/env bash
set -euo pipefail

base_ref="${1:-origin/Incubator}"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

git rev-parse --verify "$base_ref" >/dev/null
git rev-parse --verify HEAD >/dev/null

base_sha="$(git rev-parse "$base_ref")"
merge_base="$(git merge-base "$base_ref" HEAD)"

echo "base_ref=$base_ref"
echo "base_sha=$base_sha"
echo "merge_base=$merge_base"
echo "head_sha=$(git rev-parse HEAD)"

if [ "$merge_base" != "$base_sha" ]; then
  cat >&2 <<EOF
diff_guard: failed

$base_ref is not the merge-base of HEAD. This branch may include history that
was already squash-merged into Incubator. Rebase only the follow-up work:

  git rebase --onto $base_ref origin/<old-squash-merged-branch>

Then rerun this guard before opening the PR.
EOF
  exit 1
fi

echo "== diff stat =="
git diff --stat "$base_ref"...HEAD

echo "== changed files =="
git diff --name-status "$base_ref"...HEAD

echo "diff_guard: ok"
