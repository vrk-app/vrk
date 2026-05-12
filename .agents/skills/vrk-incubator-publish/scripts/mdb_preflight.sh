#!/usr/bin/env bash
set -euo pipefail

cluster_name="${1:-${YC_MDB_CLUSTER_NAME:-vrk-db}}"
min_active_seconds="${MIN_ACTIVE_SECONDS:-7200}"
yc_bin="${YC_BIN:-$(command -v yc || true)}"

if [ -z "$yc_bin" ]; then
  echo "mdb_preflight: yc CLI not found; skipping Yandex MDB state check" >&2
  exit 2
fi

json="$("$yc_bin" managed-postgresql cluster get "$cluster_name" --format json)"

status="$(printf '%s\n' "$json" | sed -n 's/.*"status"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
active_until="$(printf '%s\n' "$json" | sed -n 's/.*"active_until"[[:space:]]*:[[:space:]]*"\{0,1\}\([0-9][0-9]*\).*/\1/p' | head -1)"

echo "cluster=$cluster_name"
echo "status=${status:-unknown}"

if [ -n "$active_until" ]; then
  now="$(date +%s)"
  remaining="$((active_until - now))"
  if date -r "$active_until" >/dev/null 2>&1; then
    echo "active_until=$(date -r "$active_until" '+%Y-%m-%d %H:%M:%S %Z')"
  else
    echo "active_until=$active_until"
  fi
  echo "active_until_remaining_seconds=$remaining"
else
  echo "active_until=not-found"
fi

if [ "$status" != "RUNNING" ]; then
  echo "mdb_preflight: cluster is not RUNNING" >&2
  exit 1
fi

if [ -n "$active_until" ] && [ "$remaining" -lt "$min_active_seconds" ]; then
  echo "mdb_preflight: active_until is too close; extend it before deploy" >&2
  exit 1
fi

echo "mdb_preflight: ok"
