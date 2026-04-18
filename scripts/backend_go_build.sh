#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker run --rm \
  -v "${ROOT_DIR}:/workspace" \
  -w /workspace/apps/backend \
  golang:1.26-alpine \
  sh -lc 'apk add --no-cache git ca-certificates >/dev/null && /usr/local/go/bin/go build ./...'
