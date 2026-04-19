#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
import json
import os
import time
import urllib.error
import urllib.request


backend_port = os.getenv("BACKEND_HOST_PORT", "18080")
web_port = os.getenv("WEB_HOST_PORT", "3100")
field_port = os.getenv("FIELD_HOST_PORT", "3102")
startup_timeout_seconds = 45
retry_interval_seconds = 1


def fetch(url: str):
    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            body = response.read().decode("utf-8")
            return response.getcode(), body
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        return error.code, body


def wait_until(description: str, url: str, validator):
    deadline = time.monotonic() + startup_timeout_seconds
    last_error = None

    while time.monotonic() < deadline:
        try:
            response = fetch(url)
            validator(*response)
            return response
        except (AssertionError, OSError, urllib.error.URLError, urllib.error.HTTPError) as error:
            last_error = error
            time.sleep(retry_interval_seconds)

    raise RuntimeError(f"timed out waiting for {description} at {url}") from last_error


def assert_backend_health(status: int, body: str):
    payload = json.loads(body)
    assert status == 200, payload
    assert payload["status"] == "ok", payload


def assert_backend_ready(status: int, body: str):
    payload = json.loads(body)
    assert status == 200, payload
    assert payload["status"] == "ready", payload


def assert_unauthorized(status: int, body: str):
    payload = json.loads(body)
    assert status == 401, payload
    assert payload["success"] is False, payload
    assert payload["error"] in {"missing bearer token", "unauthorized"}, payload


def assert_web_route(status: int, body: str):
    assert status == 200, status
    assert "<h1" in body, body[:400]


def assert_company_route(status: int, body: str):
    assert_web_route(status, body)
    assert "http://backend:8080" in body, body[:400]
    assert "seed-read" in body, body[:400]


def assert_field_root(status: int, body: str):
    assert status == 200, status
    assert "Инженерный контур" in body, body[:200]
    assert "http://backend:8080" in body, body[:400]
    assert "queue-preview" in body, body[:400]


def assert_field_manifest(status: int, body: str):
    payload = json.loads(body)
    assert status == 200, payload
    assert payload["name"] == "VRK Field", payload


health_status, health_body = wait_until(
    "backend health endpoint",
    f"http://localhost:{backend_port}/healthz",
    assert_backend_health,
)
health = json.loads(health_body)
assert health_status == 200, health
assert health["status"] == "ok", health

ready_status, ready_body = wait_until(
    "backend readiness endpoint",
    f"http://localhost:{backend_port}/readyz",
    assert_backend_ready,
)
ready = json.loads(ready_body)
assert ready_status == 200, ready
assert ready["status"] == "ready", ready

org_status, org_body = fetch(f"http://localhost:{backend_port}/api/v1/organizations?limit=1&offset=0")
org_payload = json.loads(org_body)
assert org_status == 200, org_payload
assert org_payload["success"] is True, org_payload
assert org_payload["data"], org_payload

equipment_status, equipment_body = fetch(f"http://localhost:{backend_port}/api/v1/equipment?limit=1&offset=0")
assert_unauthorized(equipment_status, equipment_body)

swagger_status, _ = fetch(f"http://localhost:{backend_port}/swagger/index.html")
assert swagger_status == 200, swagger_status

for route in [
    f"http://localhost:{web_port}/login",
    f"http://localhost:{web_port}/register",
    f"http://localhost:{web_port}/company",
    f"http://localhost:{web_port}/equipment",
    f"http://localhost:{web_port}/contracts",
    f"http://localhost:{web_port}/requests",
]:
    status, body = wait_until(
        f"web route {route}",
        route,
        assert_web_route,
    )
    assert status == 200, route
    assert "<h1" in body, route

company_status, company_body = wait_until(
    "web company route",
    f"http://localhost:{web_port}/company",
    assert_company_route,
)
assert company_status == 200, company_status
assert "http://backend:8080" in company_body, company_body[:400]
assert "seed-read" in company_body, company_body[:400]

field_status, field_body = wait_until(
    "field root route",
    f"http://localhost:{field_port}/",
    assert_field_root,
)
assert field_status == 200, field_status
assert "Инженерный контур" in field_body, field_body[:200]
assert "http://backend:8080" in field_body, field_body[:400]
assert "queue-preview" in field_body, field_body[:400]

manifest_status, manifest_body = wait_until(
    "field manifest",
    f"http://localhost:{field_port}/manifest.webmanifest",
    assert_field_manifest,
)
manifest = json.loads(manifest_body)
assert manifest_status == 200, manifest
assert manifest["name"] == "VRK Field", manifest

print("platform smoke: PASS")
PY
