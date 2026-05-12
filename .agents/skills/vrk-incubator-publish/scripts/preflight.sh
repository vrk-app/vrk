#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

echo "== git diff --check =="
git diff --check
if ! git diff --cached --quiet; then
  git diff --cached --check
fi

changed_file_list="$(mktemp)"
trap 'rm -f "$changed_file_list"' EXIT

{
  git diff --name-only --diff-filter=ACMRTUXB
  git diff --cached --name-only --diff-filter=ACMRTUXB
  git ls-files --others --exclude-standard
} | sort -u > "$changed_file_list"

changed_count="$(wc -l < "$changed_file_list" | tr -d ' ')"
echo "== changed files: $changed_count =="
cat "$changed_file_list"

echo "== secret-pattern scan over changed text files =="
patterns="-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ya29\\.[A-Za-z0-9_-]+|yc\\.[A-Za-z0-9_-]{30,}|DATABASE_URL=[^[:space:]]+://[^[:space:]]+:[^[:space:]@]+@|DB_PASSWORD[[:space:]]*=[[:space:]]*['\\\"]?[^[:space:]'\\\"]{12,}"
failed=0

while IFS= read -r file_path; do
  [ -n "$file_path" ] || continue
  [ -f "$file_path" ] || continue
  if [ "$file_path" = ".agents/skills/vrk-incubator-publish/scripts/preflight.sh" ]; then
    continue
  fi
  if ! grep -Iq . "$file_path"; then
    continue
  fi
  if grep -nE -- "$patterns" "$file_path"; then
    echo "Potential secret pattern found in $file_path" >&2
    failed=1
  fi
done < "$changed_file_list"

if [ "$failed" -ne 0 ]; then
  echo "Secret-pattern scan failed. Inspect findings before publishing." >&2
  exit 1
fi

echo "preflight: ok"
