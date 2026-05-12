#!/usr/bin/env bash
set -euo pipefail

backend_url="${VRK_BACKEND_URL:-https://bbann5sjkg8iha0mmsl3.containers.yandexcloud.net}"
web_url="${VRK_WEB_URL:-https://bbamk7b1htc1ilji6l7v.containers.yandexcloud.net}"
curl_bin="${CURL_BIN:-$(command -v curl || true)}"

if [ -z "$curl_bin" ] && [ -x /usr/bin/curl ]; then
  curl_bin="/usr/bin/curl"
fi

if [ -z "$curl_bin" ]; then
  echo "runtime_health_check: curl not found" >&2
  exit 2
fi

tmp_body="$(mktemp)"
trap 'rm -f "$tmp_body"' EXIT

check_url() {
  name="$1"
  url="$2"
  code="$("$curl_bin" -L -sS --max-time 30 -o "$tmp_body" -w '%{http_code}' "$url")" || {
    echo "$name: request failed ($url)" >&2
    return 1
  }
  bytes="$(wc -c < "$tmp_body" | tr -d ' ')"
  echo "$name status=$code bytes=$bytes url=$url"
  case "$code" in
    2*|3*) ;;
    *) return 1 ;;
  esac
  if [ "$bytes" -eq 0 ]; then
    echo "$name: empty response body" >&2
    return 1
  fi
}

failed=0

check_url "backend_healthz" "$backend_url/healthz" || failed=1
check_url "backend_readyz" "$backend_url/readyz" || failed=1
check_url "web_login" "$web_url/login" || failed=1
check_url "storybook_index_html" "$web_url/storybook/index.html" || failed=1
check_url "storybook_index_json" "$web_url/storybook/index.json" || failed=1

if [ "$failed" -ne 0 ]; then
  echo "runtime_health_check: failed" >&2
  exit 1
fi

echo "runtime_health_check: ok"
