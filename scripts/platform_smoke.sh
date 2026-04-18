#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
import json
import os
import urllib.request


backend_port = os.getenv("BACKEND_HOST_PORT", "18080")
web_port = os.getenv("WEB_HOST_PORT", "3100")
field_port = os.getenv("FIELD_HOST_PORT", "3102")


def fetch(url: str):
    with urllib.request.urlopen(url, timeout=15) as response:
        body = response.read().decode("utf-8")
        return response.getcode(), body


health_status, health_body = fetch(f"http://localhost:{backend_port}/healthz")
health = json.loads(health_body)
assert health_status == 200, health
assert health["status"] == "ok", health

ready_status, ready_body = fetch(f"http://localhost:{backend_port}/readyz")
ready = json.loads(ready_body)
assert ready_status == 200, ready
assert ready["status"] == "ready", ready

org_status, org_body = fetch(f"http://localhost:{backend_port}/api/v1/organizations?limit=1&offset=0")
org_payload = json.loads(org_body)
assert org_status == 200, org_payload
assert org_payload["success"] is True, org_payload
assert org_payload["data"], org_payload

equipment_status, equipment_body = fetch(f"http://localhost:{backend_port}/api/v1/equipment?limit=1&offset=0")
equipment_payload = json.loads(equipment_body)
assert equipment_status == 200, equipment_payload
assert equipment_payload["success"] is True, equipment_payload
assert equipment_payload["data"], equipment_payload

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
    status, body = fetch(route)
    assert status == 200, route
    assert "<h1" in body, route

company_status, company_body = fetch(f"http://localhost:{web_port}/company")
assert company_status == 200, company_status
assert "http://backend:8080" in company_body, company_body[:400]
assert "seed-read" in company_body, company_body[:400]

field_status, field_body = fetch(f"http://localhost:{field_port}/")
assert field_status == 200, field_status
assert "Инженерный контур" in field_body, field_body[:200]
assert "http://backend:8080" in field_body, field_body[:400]
assert "queue-preview" in field_body, field_body[:400]

manifest_status, manifest_body = fetch(f"http://localhost:{field_port}/manifest.webmanifest")
manifest = json.loads(manifest_body)
assert manifest_status == 200, manifest
assert manifest["name"] == "VRK Field", manifest

print("platform smoke: PASS")
PY
