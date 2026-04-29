#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any


BACKEND_BASE = os.getenv("VRK_API_BASE_URL", "http://127.0.0.1:18080")
WEB_BASE = os.getenv("VRK_WEB_BASE_URL", "http://127.0.0.1:3100")
PLATFORM_ADMIN_SECRET = os.getenv("PLATFORM_ADMIN_SHARED_SECRET", "stage03-platform-admin-secret")
ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "raw"
STAMP = date.today().isoformat()
SEED = os.getenv("VRK_STAGE03_SLICE007_008_SEED", str(int(time.time())))


@dataclass
class OrgContext:
    label: str
    organization_id: str
    admin_email: str
    session_token: str
    membership_id: str
    grant_id: str


class HttpFailure(RuntimeError):
    def __init__(self, method: str, url: str, status: int, payload: Any):
        super().__init__(f"{method} {url} -> {status}")
        self.method = method
        self.url = url
        self.status = status
        self.payload = payload


def ensure_raw_dir() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)


def write_json(name: str, payload: Any) -> Path:
    path = RAW_DIR / f"slice-007-008-direct-{name}-{STAMP}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def write_log(name: str, text: str) -> Path:
    path = RAW_DIR / f"slice-007-008-direct-{name}-{STAMP}.log"
    path.write_text(text, encoding="utf-8")
    return path


def request_json(
    base_url: str,
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    platform_admin: bool = False,
) -> tuple[int, Any]:
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if platform_admin:
        headers["X-VRK-Platform-Admin-Secret"] = PLATFORM_ADMIN_SECRET

    url = f"{base_url}{path}"
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read().decode("utf-8")
            return response.getcode(), json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8")
        payload = json.loads(raw) if raw else {}
        return error.code, payload


def request_text(base_url: str, method: str, path: str) -> tuple[int, str]:
    url = f"{base_url}{path}"
    request = urllib.request.Request(url, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.getcode(), response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8")


def expect_ok(
    base_url: str,
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    platform_admin: bool = False,
    expected_status: int,
) -> dict[str, Any]:
    status, payload = request_json(
        base_url,
        method,
        path,
        body=body,
        token=token,
        platform_admin=platform_admin,
    )
    if status != expected_status or not payload.get("success"):
        raise HttpFailure(method, f"{base_url}{path}", status, payload)
    return payload


def expect_error(
    base_url: str,
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    platform_admin: bool = False,
    expected_status: int,
) -> dict[str, Any]:
    status, payload = request_json(
        base_url,
        method,
        path,
        body=body,
        token=token,
        platform_admin=platform_admin,
    )
    if status != expected_status:
        raise HttpFailure(method, f"{base_url}{path}", status, payload)
    return payload


def assert_register_boundary() -> dict[str, Any]:
    status, html = request_text(WEB_BASE, "GET", "/register")
    if status != 200:
        raise HttpFailure("GET", f"{WEB_BASE}/register", status, html[:400])
    if "PLATFORM_ADMIN_SHARED_SECRET" in html or PLATFORM_ADMIN_SECRET in html:
        raise RuntimeError("register page leaked platform admin secret into HTML")

    shell = expect_ok(
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
    return {
        "register_status": status,
        "html_secret_leak": False,
        "web_proxy_invite_id": shell["data"]["inviteId"],
        "web_proxy_invite_token": shell["data"]["inviteToken"],
    }


def create_first_admin(label: str, email: str, password: str) -> OrgContext:
    shell = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/platform/organization-shells",
        expected_status=201,
        platform_admin=True,
        body={
            "organizationName": f"VRK {label} {SEED}",
            "organizationRole": "customer",
            "firstAdminName": f"{label} Admin {SEED}",
            "firstAdminEmail": email,
        },
    )
    write_json(f"{label}-create-shell", shell)
    invite_token = shell["data"]["inviteToken"]

    inspect = expect_ok(BACKEND_BASE, "GET", f"/api/v1/first-admin-invites/{invite_token}", expected_status=200)
    write_json(f"{label}-inspect-first-admin", inspect)

    accepted = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/first-admin-invites/{invite_token}/accept",
        expected_status=200,
        body={"password": password},
    )
    write_json(f"{label}-accept-first-admin", accepted)
    session_token = accepted["data"]["sessionToken"]

    launch = expect_ok(
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
            "structureMode": "division",
            "division": {
                "type": "Branch",
                "name": f"{label} Branch {SEED}",
            },
            "unit": {
                "type": "Lab",
                "name": f"{label} Unit {SEED}",
            },
        },
    )
    write_json(f"{label}-launch", launch)

    current = expect_ok(BACKEND_BASE, "GET", "/api/v1/sessions/current", expected_status=200, token=session_token)
    write_json(f"{label}-session-current", current)

    data = current["data"]
    return OrgContext(
        label=label,
        organization_id=data["organization"]["id"],
        admin_email=email,
        session_token=session_token,
        membership_id=data["membershipId"],
        grant_id=data["grant"]["id"],
    )


def create_and_send_employee_invite(
    admin_session_token: str,
    email: str,
    full_name: str,
    scope_id: str,
) -> dict[str, Any]:
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
    write_json("multi-access-draft", draft)

    sent = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/employee-invites/{invite_id}/send",
        expected_status=200,
        token=admin_session_token,
    )
    write_json("multi-access-sent", sent)
    return sent["data"]


def main() -> int:
    ensure_raw_dir()

    register_boundary = assert_register_boundary()
    write_json("register-boundary", register_boundary)

    platform_shell_unauthorized = expect_error(
        BACKEND_BASE,
        "POST",
        "/api/v1/platform/organization-shells",
        expected_status=401,
        body={
            "organizationName": f"Unauthorized shell {SEED}",
            "organizationRole": "customer",
            "firstAdminName": f"Unauthorized Admin {SEED}",
            "firstAdminEmail": f"unauthorized-{SEED}@vrk.local",
        },
    )
    write_json("platform-shell-unauthorized", platform_shell_unauthorized)

    organizations_unauthorized = expect_error(
        BACKEND_BASE,
        "GET",
        "/api/v1/organizations?limit=1&offset=0",
        expected_status=401,
    )
    write_json("organizations-unauthorized", organizations_unauthorized)

    organizations_authorized = expect_ok(
        BACKEND_BASE,
        "GET",
        "/api/v1/organizations?limit=5&offset=0",
        expected_status=200,
        platform_admin=True,
    )
    write_json("organizations-authorized", organizations_authorized)

    shared_email = f"shared-{SEED}@vrk.local"
    initial_password = f"stage03-initial-{SEED}"
    multi_access_password = f"stage03-multi-{SEED}"

    alpha = create_first_admin("alpha", shared_email, initial_password)
    beta = create_first_admin("beta", f"beta-{SEED}@vrk.local", f"stage03-beta-{SEED}")

    login_before_conflict = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/sessions",
        expected_status=200,
        body={"email": shared_email, "password": initial_password},
    )
    write_json("login-before-conflict", login_before_conflict)

    login_before_current = expect_ok(
        BACKEND_BASE,
        "GET",
        "/api/v1/sessions/current",
        expected_status=200,
        token=login_before_conflict["data"]["sessionToken"],
    )
    write_json("login-before-conflict-current", login_before_current)

    if login_before_current["data"]["membershipId"] != alpha.membership_id:
        raise RuntimeError("single-access login returned unexpected membership before conflict")
    if login_before_current["data"]["grant"]["id"] != alpha.grant_id:
        raise RuntimeError("single-access login returned unexpected grant before conflict")

    multi_access_invite = create_and_send_employee_invite(
        beta.session_token,
        shared_email,
        f"Shared Admin {SEED}",
        beta.organization_id,
    )
    invite_token = multi_access_invite["inviteToken"]

    accepted_multi_access = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/invites/{invite_token}/accept",
        expected_status=200,
        body={"password": multi_access_password},
    )
    write_json("multi-access-accept", accepted_multi_access)

    second_session_current = expect_ok(
        BACKEND_BASE,
        "GET",
        "/api/v1/sessions/current",
        expected_status=200,
        token=accepted_multi_access["data"]["sessionToken"],
    )
    write_json("multi-access-second-current", second_session_current)

    if second_session_current["data"]["membershipId"] == alpha.membership_id:
        raise RuntimeError("second session restored the original membership instead of the new access path")

    restored_original_current = expect_ok(
        BACKEND_BASE,
        "GET",
        "/api/v1/sessions/current",
        expected_status=200,
        token=alpha.session_token,
    )
    write_json("multi-access-original-current", restored_original_current)

    if restored_original_current["data"]["membershipId"] != alpha.membership_id:
        raise RuntimeError("stored original session token did not restore the original membership")
    if restored_original_current["data"]["grant"]["id"] != alpha.grant_id:
        raise RuntimeError("stored original session token did not restore the original grant")

    conflict_login = expect_error(
        BACKEND_BASE,
        "POST",
        "/api/v1/sessions",
        expected_status=409,
        body={"email": shared_email, "password": multi_access_password},
    )
    write_json("multi-access-conflict-login", conflict_login)

    error_text = str(conflict_login.get("error", ""))
    if "multiple eligible access paths" not in error_text:
        raise RuntimeError(f"unexpected 409 error payload: {conflict_login}")

    summary = {
        "seed": SEED,
        "register_boundary": {
            "page_status": register_boundary["register_status"],
            "html_secret_leak": register_boundary["html_secret_leak"],
            "web_proxy_invite_id": register_boundary["web_proxy_invite_id"],
        },
        "admin_surface": {
            "platform_shell_unauthorized_status": 401,
            "platform_shell_unauthorized_error": str(platform_shell_unauthorized.get("error", "")),
            "unauthorized_status": 401,
            "unauthorized_error": str(organizations_unauthorized.get("error", "")),
            "authorized_status": 200,
        },
        "single_access_login": {
            "membership_id": alpha.membership_id,
            "grant_id": alpha.grant_id,
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
    }
    summary_path = write_json("summary", summary)
    write_log("summary-path", str(summary_path) + "\n")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
