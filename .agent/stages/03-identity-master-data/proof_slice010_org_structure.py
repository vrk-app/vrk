#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any


BACKEND_BASE = os.getenv("VRK_API_BASE_URL", "http://127.0.0.1:18080")
WEB_BASE = os.getenv("VRK_WEB_BASE_URL", "http://127.0.0.1:3100")
PLATFORM_ADMIN_SECRET = os.getenv("PLATFORM_ADMIN_SHARED_SECRET", "stage03-platform-admin-secret")
ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parents[2]
RAW_DIR = ROOT / "raw"
STAMP = datetime.now(UTC).date().isoformat()
SEED = os.getenv("VRK_STAGE03_SLICE010_SEED", str(int(time.time())))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


NO_REDIRECT_OPENER = urllib.request.build_opener(NoRedirect)


@dataclass
class AdminContext:
    organization_id: str
    token: str
    web_cookie: str | None = None


class HttpFailure(RuntimeError):
    def __init__(self, method: str, url: str, status: int, payload: Any):
        super().__init__(f"{method} {url} -> {status}: {payload}")
        self.method = method
        self.url = url
        self.status = status
        self.payload = payload


def write_json(name: str, payload: Any) -> Path:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    path = RAW_DIR / f"slice-010-{name}-{STAMP}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def write_log(name: str, text: str) -> Path:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    path = RAW_DIR / f"slice-010-{name}-{STAMP}.txt"
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
    cookie: str | None = None,
) -> tuple[int, Any, dict[str, str]]:
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if platform_admin:
        headers["X-VRK-Platform-Admin-Secret"] = PLATFORM_ADMIN_SECRET
    if cookie:
        headers["Cookie"] = cookie

    url = f"{base_url}{path}"
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            raw = response.read().decode("utf-8")
            return response.getcode(), json.loads(raw) if raw else {}, dict(response.headers)
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8")
        payload = json.loads(raw) if raw else {}
        return error.code, payload, dict(error.headers)


def request_text(
    base_url: str,
    method: str,
    path: str,
    *,
    cookie: str | None = None,
    follow_redirects: bool = True,
) -> tuple[int, str, dict[str, str]]:
    headers = {"Accept": "text/html"}
    if cookie:
        headers["Cookie"] = cookie
    url = f"{base_url}{path}"
    request = urllib.request.Request(url, headers=headers, method=method)
    opener = urllib.request.urlopen if follow_redirects else NO_REDIRECT_OPENER.open
    try:
        with opener(request, timeout=25) as response:
            return response.getcode(), response.read().decode("utf-8"), dict(response.headers)
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8"), dict(error.headers)


def expect_ok(
    base_url: str,
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    platform_admin: bool = False,
    cookie: str | None = None,
    expected_status: int,
) -> tuple[dict[str, Any], dict[str, str]]:
    status, payload, headers = request_json(
        base_url,
        method,
        path,
        body=body,
        token=token,
        platform_admin=platform_admin,
        cookie=cookie,
    )
    if status != expected_status or not payload.get("success"):
        raise HttpFailure(method, f"{base_url}{path}", status, payload)
    return payload, headers


def expect_error(
    base_url: str,
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    expected_status: int,
) -> dict[str, Any]:
    status, payload, _headers = request_json(base_url, method, path, body=body, token=token)
    if status != expected_status:
        raise HttpFailure(method, f"{base_url}{path}", status, payload)
    return payload


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def header_value(headers: dict[str, str], name: str) -> str:
    lowered = name.lower()
    for key, value in headers.items():
        if key.lower() == lowered:
            return value
    return ""


def future_expiry(days: int = 7) -> str:
    return (datetime.now(UTC) + timedelta(days=days)).isoformat().replace("+00:00", "Z")


def assert_company_ui_field_contract() -> dict[str, Any]:
    workspace_source = (REPO_ROOT / "apps/web/app/(runtime)/company/_components/CompanyStructureWorkspace.tsx").read_text(encoding="utf-8")
    launch_wizard_source = (REPO_ROOT / "apps/web/features/Stage03Bootstrap/ui/LaunchWizardForm.tsx").read_text(encoding="utf-8")

    for option in ("ООО", "ПАО", "НАО", "ИП"):
        assert_true(option in workspace_source, f"/company profile legal-form option {option} is missing from source")
    assert_true(
        '{ label: "АО"' not in workspace_source and '{ label: "ОАО"' not in workspace_source and '{ label: "ЗАО"' not in workspace_source,
        "/company source must not expose legacy АО/ОАО/ЗАО options",
    )
    assert_true("showType={false}" in workspace_source, "division form must hide type selector")
    assert_true("type={division.type}" not in workspace_source, "division storage type must not be displayed")
    for option in ("ВРД", "ВРЗ", "ВУ", "ВРП"):
        assert_true(option in workspace_source, f"unit type option {option} is missing from source")
    assert_true("Тип подразделения" not in launch_wizard_source, "historical launch wizard must not expose division type selector")
    assert_true("Производственный юнит" not in launch_wizard_source, "historical launch wizard must not use obsolete unit type default")

    return {
        "profileLegalForms": ["ООО", "ПАО", "НАО", "ИП"],
        "divisionTypeSelector": "hidden",
        "unitTypes": ["ВРД", "ВРЗ", "ВУ", "ВРП"],
    }


def create_shell(label: str, *, email_prefix: str) -> dict[str, Any]:
    payload, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/platform/organization-shells",
        expected_status=201,
        platform_admin=True,
        body={
            "organizationName": f"VRK {label} {SEED}",
            "organizationRole": "customer",
            "firstAdminName": f"{label} Admin",
            "firstAdminEmail": f"{email_prefix}-{SEED}@vrk.local",
        },
    )
    return payload["data"]


def accept_first_admin_backend(label: str, *, email_prefix: str) -> AdminContext:
    shell = create_shell(label, email_prefix=email_prefix)
    token = shell["inviteToken"]

    inspection, _ = expect_ok(BACKEND_BASE, "GET", f"/api/v1/first-admin-invites/{token}", expected_status=200)
    assert_true(inspection["data"]["launchState"] in {"shell", "active"}, "first-admin inspection returned unexpected launch state")

    accepted, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/first-admin-invites/{token}/accept",
        expected_status=200,
        body={"password": f"Pass-{SEED}-admin"},
    )
    data = accepted["data"]
    assert_active_company_session(data)
    assert_true(data["divisions"] == [] and data["units"] == [], "fresh first-admin session should not require initial structure")
    write_json(f"{label}-first-admin-accept", accepted)
    return AdminContext(organization_id=data["organization"]["id"], token=data["sessionToken"])


def accept_first_admin_web(label: str, *, email_prefix: str) -> AdminContext:
    shell = create_shell(label, email_prefix=email_prefix)
    token = shell["inviteToken"]

    page_status, page_html, _ = request_text(WEB_BASE, "GET", f"/register/{token}")
    assert_true(page_status == 200, f"register token page returned {page_status}")
    assert_true("/company/setup" not in page_html, "register token page should not require /company/setup copy")

    accepted, headers = expect_ok(
        WEB_BASE,
        "POST",
        f"/api/auth/invites/{token}/accept",
        expected_status=200,
        body={"password": f"Pass-{SEED}-web"},
    )
    data = accepted["data"]
    assert_active_company_session(data)
    cookie = header_value(headers, "Set-Cookie").split(";", 1)[0]
    assert_true(cookie.startswith("vrk_session="), "web accept did not set vrk_session cookie")

    company_status, company_html, _ = request_text(WEB_BASE, "GET", "/company", cookie=cookie)
    assert_true(company_status == 200, f"/company returned {company_status}")
    assert_true("Управляйте профилем" in company_html or "Профиль" in company_html, "/company did not render company management surface")
    ui_field_contract = assert_company_ui_field_contract()

    setup_status, _setup_html, setup_headers = request_text(WEB_BASE, "GET", "/company/setup", cookie=cookie, follow_redirects=False)
    assert_true(setup_status in {307, 308}, f"/company/setup should redirect, got {setup_status}")
    setup_location = header_value(setup_headers, "Location")
    assert_true(urllib.parse.urlparse(setup_location).path == "/company", "/company/setup did not redirect to /company")

    write_json(
        f"{label}-web-accept-company",
        {
            "accepted": accepted,
            "companyStatus": company_status,
            "setupStatus": setup_status,
            "setupLocation": setup_location,
            "uiFieldContract": ui_field_contract,
        },
    )
    return AdminContext(organization_id=data["organization"]["id"], token=data["sessionToken"], web_cookie=cookie)


def assert_active_company_session(data: dict[str, Any]) -> None:
    assert_true(data["requiresLaunchWizard"] is False, "active session must not require launch wizard")
    assert_true(data["organization"]["launchState"] == "active", "organization must be active")
    assert_true(data["workspace"]["landingPath"] == "/company", "workspace landing path must be /company")
    assert_true(data["grant"]["roleTemplate"] == "organization_admin", "first admin must be organization_admin")
    assert_true(data["grant"]["scopeType"] == "organization", "first admin must be organization scoped")


def company_profile_payload(label: str, property_type: str = "ООО", *, legacy_type: str | None = None) -> dict[str, Any]:
    payload = {
        "propertyType": property_type,
        "name": f"VRK {label} профиль {SEED}",
        "shortName": f"{label}-{SEED}"[:24],
        "inn": f"{SEED[:10]:0<10}",
        "kpp": f"{SEED[:9]:0<9}",
        "registeredAddress": f"{label}, Промышленная 1",
        "leaderFullName": f"{label} Руководитель",
        "leaderPosition": "Директор",
        "contractPhone": "+7 999 100-00-01",
        "contractEmail": f"{label.lower()}-{SEED}@vrk.local",
        "actingBasis": "Устав",
    }
    if property_type == "ИП":
        payload["inn"] = f"{SEED[:12]:0<12}"
        payload["kpp"] = ""
        payload["ogrn"] = f"{SEED[:15]:0<15}"
    else:
        payload["ogrn"] = f"{SEED[:13]:0<13}"
    if legacy_type is not None:
        payload.pop("propertyType")
        payload["type"] = legacy_type
    return payload


def division_payload(label: str) -> dict[str, Any]:
    return {
        "name": f"{label} подразделение {SEED}",
        "region": "Москва",
        "registeredAddress": f"{label}, Заводская 2",
        "leaderFullName": f"{label} Начальник",
        "leaderPosition": "Руководитель подразделения",
        "contractPhone": "+7 999 200-00-02",
        "contractEmail": f"{label.lower()}-div-{SEED}@vrk.local",
        "actingBasis": "Приказ",
        "comment": "Создано proof_slice010",
    }


def unit_payload(label: str, division_id: str | None = None) -> dict[str, Any]:
    payload = {
        "type": "ВУ",
        "name": f"{label} юнит {SEED}",
        "region": "Москва",
        "registeredAddress": f"{label}, Лабораторная 3",
        "leaderFullName": f"{label} Ответственный",
        "leaderPosition": "Начальник юнита",
        "contractPhone": "+7 999 300-00-03",
        "contractEmail": f"{label.lower()}-unit-{SEED}@vrk.local",
        "actingBasis": "Доверенность",
        "comment": "Создано proof_slice010",
    }
    if division_id:
        payload["divisionId"] = division_id
    return payload


def create_employee_invite(admin: AdminContext, label: str, role: str, scope_type: str, scope_id: str) -> dict[str, Any]:
    payload, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/employee-invites",
        expected_status=201,
        token=admin.token,
        body={
            "fullName": f"{label} User",
            "email": f"{label}-{SEED}@vrk.local",
            "roleTemplate": role,
            "scopeType": scope_type,
            "scopeId": scope_id,
            "expiresAt": future_expiry(),
        },
    )
    return payload["data"]


def send_and_accept_employee(admin: AdminContext, invite_id: str, label: str) -> dict[str, Any]:
    sent, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/employee-invites/{invite_id}/send",
        expected_status=200,
        token=admin.token,
    )
    token = sent["data"]["inviteToken"]
    accepted, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/invites/{token}/accept",
        expected_status=200,
        body={"password": f"Pass-{SEED}-{label}"},
    )
    return accepted["data"]


def run_primary_org_proof() -> dict[str, Any]:
    admin = accept_first_admin_backend("primary", email_prefix="slice010-primary-admin")

    profiled, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=200,
        token=admin.token,
        body=company_profile_payload("primary", "ООО"),
    )
    assert_true(profiled["data"]["organization"]["propertyType"] == "ООО", "organization profile did not preserve ООО legal form")
    assert_true(profiled["data"]["organization"]["type"] == "ООО", "organization type alias did not mirror propertyType")
    assert_true(profiled["data"]["organization"]["leaderFullName"] == "primary Руководитель", "profile leaderFullName was not preserved")
    assert_true(profiled["data"]["organization"]["actingBasis"] == "Устав", "profile actingBasis was not preserved")

    accepted_nao, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=200,
        token=admin.token,
        body=company_profile_payload("accepted-nao", "НАО"),
    )
    accepted_pao, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=200,
        token=admin.token,
        body=company_profile_payload("accepted-pao", "ПАО"),
    )
    accepted_ip, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=200,
        token=admin.token,
        body=company_profile_payload("accepted-ip", "ИП"),
    )
    legacy_ao, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=200,
        token=admin.token,
        body=company_profile_payload("legacy-ao", legacy_type="АО"),
    )
    legacy_oao, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=200,
        token=admin.token,
        body=company_profile_payload("legacy-oao", legacy_type="ОАО"),
    )
    legacy_zao, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=200,
        token=admin.token,
        body=company_profile_payload("legacy-zao", legacy_type="ЗАО"),
    )
    legacy_llc, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=200,
        token=admin.token,
        body=company_profile_payload("legacy-llc", legacy_type="LLC"),
    )
    assert_true(accepted_nao["data"]["organization"]["propertyType"] == "НАО", "organization profile rejected НАО")
    assert_true(accepted_pao["data"]["organization"]["propertyType"] == "ПАО", "organization profile rejected ПАО")
    assert_true(accepted_ip["data"]["organization"]["propertyType"] == "ИП", "organization profile rejected ИП")
    assert_true(accepted_ip["data"]["organization"].get("kpp") is None, "ИП organization profile did not clear КПП")
    assert_true(legacy_ao["data"]["organization"]["propertyType"] == "НАО", "legacy АО did not normalize to НАО")
    assert_true(legacy_oao["data"]["organization"]["propertyType"] == "ПАО", "legacy ОАО did not normalize to ПАО")
    assert_true(legacy_zao["data"]["organization"]["propertyType"] == "НАО", "legacy ЗАО did not normalize to НАО")
    assert_true(legacy_llc["data"]["organization"]["propertyType"] == "ООО", "legacy LLC did not normalize to ООО")

    invalid_profile = expect_error(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=400,
        token=admin.token,
        body=company_profile_payload("invalid-profile", "ВРД"),
    )

    first_division, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/company/divisions",
        expected_status=201,
        token=admin.token,
        body=division_payload("first"),
    )
    first_division_id = first_division["data"]["divisions"][0]["id"]
    assert_true(first_division["data"]["divisions"][0]["type"] == "division", "division storage type should remain hidden internal default")
    assert_true(first_division["data"]["divisions"][0]["leaderPosition"] == "Руководитель подразделения", "division business fields not preserved")

    first_unit, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/company/units",
        expected_status=201,
        token=admin.token,
        body=unit_payload("child", first_division_id),
    )
    child_unit = next(unit for unit in first_unit["data"]["units"] if unit["name"].startswith("child юнит"))
    assert_true(child_unit["divisionId"] == first_division_id, "child unit is not under division")
    assert_true(child_unit["type"] == "ВУ", "unit operational type was not preserved")

    invalid_unit_payload = unit_payload("invalid-unit")
    invalid_unit_payload["type"] = "ООО"
    invalid_unit = expect_error(
        BACKEND_BASE,
        "POST",
        "/api/v1/company/units",
        expected_status=400,
        token=admin.token,
        body=invalid_unit_payload,
    )

    direct_unit, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/company/units",
        expected_status=201,
        token=admin.token,
        body=unit_payload("direct"),
    )
    direct_unit_id = next(unit for unit in direct_unit["data"]["units"] if unit["name"].startswith("direct юнит"))["id"]

    second_division, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/company/divisions",
        expected_status=201,
        token=admin.token,
        body=division_payload("second"),
    )
    second_division_id = next(division for division in second_division["data"]["divisions"] if division["name"].startswith("second подразделение"))["id"]

    second_unit, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/company/units",
        expected_status=201,
        token=admin.token,
        body=unit_payload("second", second_division_id),
    )
    assert_true(len(second_unit["data"]["divisions"]) == 2, "repeat division creation failed")
    assert_true(len(second_unit["data"]["units"]) == 3, "repeat/direct unit creation failed")

    edited_division_payload = division_payload("first-edited")
    edited_division_payload["comment"] = "Редактирование proof_slice010"
    edited_division, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        f"/api/v1/company/divisions/{first_division_id}",
        expected_status=200,
        token=admin.token,
        body=edited_division_payload,
    )
    assert_true(
        next(division for division in edited_division["data"]["divisions"] if division["id"] == first_division_id)["comment"] == "Редактирование proof_slice010",
        "division edit did not persist",
    )

    edited_unit_payload = unit_payload("child-edited", first_division_id)
    edited_unit, _ = expect_ok(
        BACKEND_BASE,
        "PATCH",
        f"/api/v1/company/units/{child_unit['id']}",
        expected_status=200,
        token=admin.token,
        body=edited_unit_payload,
    )
    assert_true(
        next(unit for unit in edited_unit["data"]["units"] if unit["id"] == child_unit["id"])["name"].startswith("child-edited юнит"),
        "unit edit did not persist",
    )

    archive_unit_source, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/company/units",
        expected_status=201,
        token=admin.token,
        body=unit_payload("archive-direct"),
    )
    archive_unit_id = next(unit for unit in archive_unit_source["data"]["units"] if unit["name"].startswith("archive-direct юнит"))["id"]
    archived_unit, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/company/units/{archive_unit_id}/archive",
        expected_status=200,
        token=admin.token,
    )
    assert_true(all(unit["id"] != archive_unit_id for unit in archived_unit["data"]["units"]), "archived unit stayed visible")

    archive_division_source, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        "/api/v1/company/divisions",
        expected_status=201,
        token=admin.token,
        body=division_payload("archive-empty"),
    )
    archive_division_id = next(division for division in archive_division_source["data"]["divisions"] if division["name"].startswith("archive-empty подразделение"))["id"]
    archived_division, _ = expect_ok(
        BACKEND_BASE,
        "POST",
        f"/api/v1/company/divisions/{archive_division_id}/archive",
        expected_status=200,
        token=admin.token,
    )
    assert_true(all(division["id"] != archive_division_id for division in archived_division["data"]["divisions"]), "archived division stayed visible")

    blocked_division = expect_error(
        BACKEND_BASE,
        "POST",
        f"/api/v1/company/divisions/{first_division_id}/archive",
        token=admin.token,
        expected_status=409,
    )

    blocking_invite = create_employee_invite(admin, "unit-blocker", "unit_operator", "unit", child_unit["id"])
    blocked_unit = expect_error(
        BACKEND_BASE,
        "POST",
        f"/api/v1/company/units/{child_unit['id']}/archive",
        token=admin.token,
        expected_status=409,
    )

    missing_target = expect_error(
        BACKEND_BASE,
        "POST",
        "/api/v1/employee-invites",
        expected_status=400,
        token=admin.token,
        body={
            "fullName": "Missing Target",
            "email": f"missing-target-{SEED}@vrk.local",
            "roleTemplate": "unit_operator",
            "scopeType": "unit",
            "scopeId": "00000000-0000-0000-0000-000000000000",
            "expiresAt": future_expiry(),
        },
    )
    archived_unit_target = expect_error(
        BACKEND_BASE,
        "POST",
        "/api/v1/employee-invites",
        expected_status=400,
        token=admin.token,
        body={
            "fullName": "Archived Unit Target",
            "email": f"archived-unit-target-{SEED}@vrk.local",
            "roleTemplate": "unit_operator",
            "scopeType": "unit",
            "scopeId": archive_unit_id,
            "expiresAt": future_expiry(),
        },
    )
    archived_division_target = expect_error(
        BACKEND_BASE,
        "POST",
        "/api/v1/employee-invites",
        expected_status=400,
        token=admin.token,
        body={
            "fullName": "Archived Division Target",
            "email": f"archived-div-target-{SEED}@vrk.local",
            "roleTemplate": "division_head",
            "scopeType": "division",
            "scopeId": archive_division_id,
            "expiresAt": future_expiry(),
        },
    )

    division_invite = create_employee_invite(admin, "division-reader", "division_head", "division", first_division_id)
    division_session = send_and_accept_employee(admin, division_invite["id"], "division-reader")
    assert_true(division_session["workspace"]["scopeType"] == "division", "division user did not get division workspace")
    assert_true(len(division_session["divisions"]) == 1, "division user should see only target division")
    assert_true(all(unit.get("divisionId") == first_division_id for unit in division_session["units"]), "division user saw units outside subtree")
    assert_true(division_session["workspace"]["canManageEmployeeInvites"] is False, "division user should not manage invites")
    division_mutation = expect_error(
        BACKEND_BASE,
        "POST",
        "/api/v1/company/units",
        expected_status=403,
        token=division_session["sessionToken"],
        body=unit_payload("forbidden-division", first_division_id),
    )

    unit_invite = create_employee_invite(admin, "unit-reader", "unit_operator", "unit", child_unit["id"])
    unit_session = send_and_accept_employee(admin, unit_invite["id"], "unit-reader")
    assert_true(unit_session["workspace"]["scopeType"] == "unit", "unit user did not get unit workspace")
    assert_true(len(unit_session["units"]) == 1 and unit_session["units"][0]["id"] == child_unit["id"], "unit user should see only target unit")
    assert_true(unit_session["divisions"] == [], "unit user should not see parent/broader division graph")
    unit_mutation = expect_error(
        BACKEND_BASE,
        "PATCH",
        "/api/v1/company/profile",
        expected_status=403,
        token=unit_session["sessionToken"],
        body=company_profile_payload("forbidden-unit"),
    )

    summary = {
        "organizationId": admin.organization_id,
        "firstDivisionId": first_division_id,
        "childUnitId": child_unit["id"],
        "directUnitId": direct_unit_id,
        "secondDivisionId": second_division_id,
        "archivedUnitId": archive_unit_id,
        "archivedDivisionId": archive_division_id,
        "blockingInviteId": blocking_invite["id"],
        "blockedDivisionArchive": blocked_division,
        "blockedUnitArchive": blocked_unit,
        "missingTargetInvite": missing_target,
        "archivedUnitInvite": archived_unit_target,
        "archivedDivisionInvite": archived_division_target,
        "legalFormProof": {
            "accepted": ["ООО", "ПАО", "НАО", "ИП"],
            "legacyAliases": {
                "АО": legacy_ao["data"]["organization"]["propertyType"],
                "ОАО": legacy_oao["data"]["organization"]["propertyType"],
                "ЗАО": legacy_zao["data"]["organization"]["propertyType"],
                "LLC": legacy_llc["data"]["organization"]["propertyType"],
            },
            "invalidOperationalTypeError": invalid_profile,
        },
        "invalidUnitType": invalid_unit,
        "divisionScopedSession": {
            "workspace": division_session["workspace"],
            "divisionCount": len(division_session["divisions"]),
            "unitCount": len(division_session["units"]),
            "mutationError": division_mutation,
        },
        "unitScopedSession": {
            "workspace": unit_session["workspace"],
            "divisionCount": len(unit_session["divisions"]),
            "unitCount": len(unit_session["units"]),
            "mutationError": unit_mutation,
        },
    }
    write_json("primary-org-structure-proof", summary)
    return summary


def run_empty_org_invite_proof() -> dict[str, Any]:
    admin = accept_first_admin_backend("empty", email_prefix="slice010-empty-admin")
    invite = create_employee_invite(admin, "org-before-structure", "organization_head", "organization", admin.organization_id)
    assert_true(invite["scopeType"] == "organization", "org-scope invite before structure did not preserve organization scope")
    current, _ = expect_ok(BACKEND_BASE, "GET", "/api/v1/sessions/current", expected_status=200, token=admin.token)
    assert_true(current["data"]["divisions"] == [] and current["data"]["units"] == [], "empty org should still have no structure")
    summary = {"organizationId": admin.organization_id, "invite": invite, "currentStructure": current["data"]}
    write_json("empty-org-invite-proof", summary)
    return summary


def main() -> None:
    web = accept_first_admin_web("web", email_prefix="slice010-web-admin")
    primary = run_primary_org_proof()
    empty = run_empty_org_invite_proof()

    summary = {
        "seed": SEED,
        "backendBase": BACKEND_BASE,
        "webBase": WEB_BASE,
        "webActivation": {
            "organizationId": web.organization_id,
            "cookieSet": bool(web.web_cookie),
        },
        "primary": primary,
        "emptyOrgInvite": empty,
        "status": "PASS",
    }
    write_json("summary", summary)
    write_log(
        "proof-run",
        "\n".join(
            [
                f"slice-010 proof PASS seed={SEED}",
                "first-admin web acceptance issued active session and /company landing",
                "organization profile legal-form contract accepted ООО/ПАО/НАО/ИП and normalized legacy aliases",
                "division create/update omitted user-facing type while unit type remained required",
                "persistent /company APIs created/edited/archived divisions and units",
                "archive blockers and hidden archived invite-target validation returned expected errors",
                "division/unit scoped users saw read-only subtree projections and backend mutations returned 403",
                "org-scope employee invite worked before any division or unit existed",
            ]
        )
        + "\n",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
