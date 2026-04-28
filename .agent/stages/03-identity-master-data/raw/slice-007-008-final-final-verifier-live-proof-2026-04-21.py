#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from datetime import date, timedelta
from pathlib import Path


BACKEND_BASE = os.getenv("VRK_API_BASE_URL", "http://127.0.0.1:18080")
WEB_BASE = os.getenv("VRK_WEB_BASE_URL", "http://127.0.0.1:3100")
PLATFORM_ADMIN_SECRET = os.getenv("PLATFORM_ADMIN_SHARED_SECRET", "stage03-platform-admin-secret")
RAW_DIR = Path(__file__).resolve().parent
SUMMARY_PATH = RAW_DIR / "slice-007-008-final-final-verifier-live-summary-2026-04-21.json"
SEED = str(int(time.time()))


class HttpFailure(RuntimeError):
    pass


def request_json(base_url: str, method: str, path: str, *, body=None, token=None, platform_admin=False):
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if platform_admin:
        headers["X-VRK-Platform-Admin-Secret"] = PLATFORM_ADMIN_SECRET

    request = urllib.request.Request(f"{base_url}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return response.getcode(), json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8")
        return error.code, json.loads(raw) if raw else {}


def request_text(base_url: str, method: str, path: str):
    request = urllib.request.Request(f"{base_url}{path}", method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.getcode(), response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8")


def expect_ok(base_url: str, method: str, path: str, *, expected_status: int, body=None, token=None, platform_admin=False):
    status, payload = request_json(base_url, method, path, body=body, token=token, platform_admin=platform_admin)
    if status != expected_status or not payload.get("success"):
        raise HttpFailure(f"{method} {base_url}{path} -> {status}: {payload}")
    return payload


def expect_error(base_url: str, method: str, path: str, *, expected_status: int, body=None, token=None, platform_admin=False):
    status, payload = request_json(base_url, method, path, body=body, token=token, platform_admin=platform_admin)
    if status != expected_status:
        raise HttpFailure(f"{method} {base_url}{path} -> {status}: {payload}")
    return payload


def create_first_admin(label: str, email: str, password: str):
    shell = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/platform/organization-shells",
        expected_status=201,
        platform_admin=True,
        body={
            "organizationName": f"VRK {label} {SEED}",
            "organizationRole": "customer",
            "firstAdminName": f"{label.title()} Admin {SEED}",
            "firstAdminEmail": email,
        },
    )
    invite_token = shell["data"]["inviteToken"]
    expect_ok(BACKEND_BASE, "GET", f"/api/v1/first-admin-invites/{invite_token}", expected_status=200)
    accepted = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/first-admin-invites/{invite_token}/accept",
        expected_status=200,
        body={"password": password},
    )
    session_token = accepted["data"]["sessionToken"]
    expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/launch-wizard",
        expected_status=200,
        token=session_token,
        body={
            "organizationName": f"VRK {label} {SEED}",
            "shortName": f"{label[:3].upper()}-{SEED}",
            "propertyType": "LLC",
            "inn": f"{SEED[:10]:0<10}",
            "kpp": f"{SEED[:9]:0<9}",
            "legalAddress": f"{label} street 1",
            "contactEmail": email,
            "contactPhone": "+7 (999) 123-45-67",
            "structureMode": "subdivision",
            "subdivision": {"type": "Branch", "name": f"{label} Branch {SEED}"},
            "unit": {"type": "Lab", "name": f"{label} Unit {SEED}"},
        },
    )
    current = expect_ok(BACKEND_BASE, "GET", "/api/v1/sessions/current", expected_status=200, token=session_token)
    return {
        "organization_id": current["data"]["organization"]["id"],
        "session_token": session_token,
        "membership_id": current["data"]["membershipId"],
        "grant_id": current["data"]["grant"]["id"],
    }


def create_and_send_employee_invite(admin_session_token: str, email: str, full_name: str, scope_id: str):
    draft = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/employee-invites",
        expected_status=201,
        token=admin_session_token,
        body={
            "fullName": full_name,
            "email": email,
            "roleTemplate": "organization_admin",
            "scopeType": "organization",
            "scopeId": scope_id,
            "expiresAt": (date.today() + timedelta(days=7)).strftime("%Y-%m-%dT00:00:00Z"),
        },
    )
    invite_id = draft["data"]["id"]
    sent = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/employee-invites/{invite_id}/send",
        expected_status=200,
        token=admin_session_token,
    )
    return sent["data"]


def main() -> int:
    register_status, register_html = request_text(WEB_BASE, "GET", "/register")
    if register_status != 200:
        raise HttpFailure(f"GET {WEB_BASE}/register -> {register_status}")
    if "PLATFORM_ADMIN_SHARED_SECRET" in register_html or PLATFORM_ADMIN_SECRET in register_html:
        raise RuntimeError("platform admin secret leaked into /register HTML")

    web_proxy = expect_ok(
        WEB_BASE,
        "POST",
        "/api/platform/organization-shells",
        expected_status=201,
        body={
            "organizationName": f"VRK boundary {SEED}",
            "organizationRole": "customer",
            "firstAdminName": f"Boundary Admin {SEED}",
            "firstAdminEmail": f"boundary-{SEED}@vrk.local",
        },
    )

    platform_shell_unauthorized = expect_error(
        BACKEND_BASE,
        "POST",
        "/api/v1/platform/organization-shells",
        expected_status=401,
        body={
            "organizationName": f"VRK unauthorized {SEED}",
            "organizationRole": "customer",
            "firstAdminName": "Unauthorized Admin",
            "firstAdminEmail": f"unauth-{SEED}@vrk.local",
        },
    )
    organizations_unauthorized = expect_error(
        BACKEND_BASE,
        "GET",
        "/api/v1/organizations?limit=1&offset=0",
        expected_status=401,
    )
    organizations_authorized = expect_ok(
        BACKEND_BASE,
        "GET",
        "/api/v1/organizations?limit=5&offset=0",
        expected_status=200,
        platform_admin=True,
    )

    shared_email = f"shared-final-final-{SEED}@vrk.local"
    initial_password = f"stage03-initial-{SEED}"
    multi_access_password = f"stage03-multi-{SEED}"
    alpha = create_first_admin("alpha-final-final", shared_email, initial_password)
    beta = create_first_admin("beta-final-final", f"beta-final-final-{SEED}@vrk.local", f"stage03-beta-{SEED}")

    login_before_conflict = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/sessions",
        expected_status=200,
        body={"email": shared_email, "password": initial_password},
    )
    login_before_current = expect_ok(
        BACKEND_BASE,
        "GET",
        "/api/v1/sessions/current",
        expected_status=200,
        token=login_before_conflict["data"]["sessionToken"],
    )
    if login_before_current["data"]["membershipId"] != alpha["membership_id"]:
        raise RuntimeError("single-access login returned unexpected membership before conflict")
    if login_before_current["data"]["grant"]["id"] != alpha["grant_id"]:
        raise RuntimeError("single-access login returned unexpected grant before conflict")

    multi_access_invite = create_and_send_employee_invite(
        beta["session_token"],
        shared_email,
        f"Shared Admin {SEED}",
        beta["organization_id"],
    )
    accepted_multi_access = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/invites/{multi_access_invite['inviteToken']}/accept",
        expected_status=200,
        body={"password": multi_access_password},
    )
    second_session_current = expect_ok(
        BACKEND_BASE,
        "GET",
        "/api/v1/sessions/current",
        expected_status=200,
        token=accepted_multi_access["data"]["sessionToken"],
    )
    if second_session_current["data"]["membershipId"] == alpha["membership_id"]:
        raise RuntimeError("second session restored the original membership instead of the new access path")

    restored_original_current = expect_ok(
        BACKEND_BASE,
        "GET",
        "/api/v1/sessions/current",
        expected_status=200,
        token=alpha["session_token"],
    )
    if restored_original_current["data"]["membershipId"] != alpha["membership_id"]:
        raise RuntimeError("stored original session token did not restore the original membership")
    if restored_original_current["data"]["grant"]["id"] != alpha["grant_id"]:
        raise RuntimeError("stored original session token did not restore the original grant")

    conflict_login = expect_error(
        BACKEND_BASE,
        "POST",
        "/api/v1/sessions",
        expected_status=409,
        body={"email": shared_email, "password": multi_access_password},
    )
    error_text = str(conflict_login.get("error", ""))
    if "multiple eligible access paths" not in error_text:
        raise RuntimeError(f"unexpected 409 error payload: {conflict_login}")

    summary = {
        "seed": SEED,
        "ports": {
            "backend": "127.0.0.1:18080",
            "web": "127.0.0.1:3100",
        },
        "register_boundary": {
            "page_status": register_status,
            "html_secret_leak": False,
            "web_proxy_status": 201,
            "web_proxy_invite_id": web_proxy["data"]["inviteId"],
        },
        "admin_surface": {
            "platform_shell_unauthorized_status": 401,
            "platform_shell_unauthorized_error": platform_shell_unauthorized.get("error"),
            "organizations_unauthorized_status": 401,
            "organizations_unauthorized_error": organizations_unauthorized.get("error"),
            "organizations_authorized_status": 200,
            "authorized_organizations_total": organizations_authorized.get("meta", {}).get("total"),
        },
        "single_access_login": {
            "membership_id": alpha["membership_id"],
            "grant_id": alpha["grant_id"],
        },
        "session_restore": {
            "original_membership_id": restored_original_current["data"]["membershipId"],
            "original_grant_id": restored_original_current["data"]["grant"]["id"],
            "second_membership_id": second_session_current["data"]["membershipId"],
            "second_grant_id": second_session_current["data"]["grant"]["id"],
        },
        "multi_access_login": {
            "status": 409,
            "error": error_text,
        },
        "notes": {
            "workspace_picker_widening_observed": False,
            "login_ui_continues_singular_landing": True,
            "review_basis": [
                "apps/web/app/login/page.tsx uses resolveSessionLandingPath(session) with no chooser state",
                "POST /api/v1/sessions returned 409 conflict instead of issuing a widened multi-workspace session",
            ],
        },
    }
    SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
