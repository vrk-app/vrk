#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any


API_BASE = os.getenv("VRK_API_BASE_URL", "http://127.0.0.1:18080")
ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "raw"
TODAY = date.today()
STAMP = TODAY.isoformat()
SEED = os.getenv("VRK_STAGE03_SLICE003_SEED", str(int(time.time())))


@dataclass
class OrgContext:
    label: str
    organization_id: str
    email: str
    password: str
    session_token: str
    session: dict[str, Any]


class HttpFailure(RuntimeError):
    def __init__(self, method: str, path: str, status: int, payload: Any):
        super().__init__(f"{method} {path} -> {status}")
        self.method = method
        self.path = path
        self.status = status
        self.payload = payload


def ensure_raw_dir() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)


def write_json(name: str, payload: Any) -> Path:
    path = RAW_DIR / f"slice-003-direct-{name}-{STAMP}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def write_log(name: str, text: str) -> Path:
    path = RAW_DIR / f"slice-003-direct-{name}-{STAMP}.log"
    path.write_text(text, encoding="utf-8")
    return path


def request_json(
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
) -> tuple[int, Any]:
    url = f"{API_BASE}{path}"
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
            return response.getcode(), json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8")
        payload = json.loads(raw) if raw else {}
        return error.code, payload


def expect_ok(
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    expected_status: int,
) -> dict[str, Any]:
    status, payload = request_json(method, path, body=body, token=token)
    if status != expected_status:
        raise HttpFailure(method, path, status, payload)
    if not payload.get("success"):
        raise HttpFailure(method, path, status, payload)
    return payload


def expect_error(
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    expected_status: int,
) -> dict[str, Any]:
    status, payload = request_json(method, path, body=body, token=token)
    if status != expected_status:
        raise HttpFailure(method, path, status, payload)
    return payload


def create_org(label: str, role: str) -> OrgContext:
    email = f"{label}-{SEED}@vrk.local"
    password = f"stage03-{label}-{SEED}"
    org_name = f"ВРК {label} {SEED}"

    create_shell = expect_ok(
        "POST",
        "/api/v1/platform/organization-shells",
        expected_status=201,
        body={
            "organizationName": org_name,
            "organizationRole": role,
            "firstAdminName": f"{label.title()} Admin {SEED}",
            "firstAdminEmail": email,
        },
    )
    write_json(f"{label}-create-shell", create_shell)
    invite_token = create_shell["data"]["inviteToken"]

    inspect = expect_ok("GET", f"/api/v1/first-admin-invites/{invite_token}", expected_status=200)
    write_json(f"{label}-inspect-invite", inspect)

    accepted = expect_ok(
        "POST",
        f"/api/v1/first-admin-invites/{invite_token}/accept",
        expected_status=200,
        body={"password": password},
    )
    write_json(f"{label}-accept-first-admin", accepted)
    session = accepted["data"]
    session_token = session["sessionToken"]

    launch = expect_ok(
        "POST",
        "/api/v1/launch-wizard",
        expected_status=200,
        token=session_token,
        body={
            "organizationName": org_name,
            "shortName": f"{label[:3].upper()}-{SEED}",
            "propertyType": "ООО",
            "inn": f"{SEED[:10]:0<10}",
            "kpp": f"{SEED[:9]:0<9}",
            "legalAddress": f"г. Москва, ул. {label}, д. 1",
            "contactEmail": email,
            "contactPhone": "+7 (999) 123-45-67",
            "structureMode": "subdivision",
            "subdivision": {
                "type": "Филиал",
                "name": f"{label.title()} Подразделение {SEED}",
            },
            "unit": {
                "type": "Юнит",
                "name": f"{label.title()} Юнит {SEED}",
            },
        },
    )
    write_json(f"{label}-launch", launch)
    session = launch["data"]
    session_token = session["sessionToken"]

    current = expect_ok("GET", "/api/v1/sessions/current", expected_status=200, token=session_token)
    write_json(f"{label}-session-current", current)

    login = expect_ok(
        "POST",
        "/api/v1/sessions",
        expected_status=200,
        body={"email": email, "password": password},
    )
    write_json(f"{label}-login", login)

    return OrgContext(
        label=label,
        organization_id=session["organization"]["id"],
        email=email,
        password=password,
        session_token=session_token,
        session=current["data"],
    )


def create_contract(
    name: str,
    customer: OrgContext,
    contractor_org_id: str,
    *,
    contract_number: str,
    contract_status: str,
    start_date: str,
    end_date: str,
    work_type: str,
    equipment_type: str,
    region: str,
    unit_id: str,
    subject: str,
) -> dict[str, Any]:
    payload = expect_ok(
        "POST",
        "/api/v1/agreements",
        expected_status=201,
        token=customer.session_token,
        body={
            "contractorOrganizationId": contractor_org_id,
            "contractNumber": contract_number,
            "contractStatus": contract_status,
            "startDate": start_date,
            "endDate": end_date,
            "workType": work_type,
            "equipmentType": equipment_type,
            "region": region,
            "unitId": unit_id,
            "subjectOfAgreement": subject,
        },
    )
    write_json(name, payload)
    return payload["data"]


def main() -> int:
    ensure_raw_dir()
    log_lines: list[str] = []
    statuses: dict[str, int] = {}

    try:
        customer = create_org("customer-contracts", "customer")
        contractor_a = create_org("contractor-alpha", "contractor")
        contractor_b = create_org("contractor-bravo", "contractor")

        statuses["customerLandingStatus"] = 200
        statuses["contractorAlphaLandingStatus"] = 200
        statuses["contractorBravoLandingStatus"] = 200

        customer_unit = customer.session["units"][0]
        contractor_options_payload = expect_ok(
            "GET",
            "/api/v1/agreements/contractors",
            expected_status=200,
            token=customer.session_token,
        )
        write_json("contractor-options", contractor_options_payload)
        contractor_options = contractor_options_payload["data"]

        active_start = (TODAY - timedelta(days=2)).isoformat()
        active_end = (TODAY + timedelta(days=30)).isoformat()
        future_start = (TODAY + timedelta(days=10)).isoformat()
        future_end = (TODAY + timedelta(days=40)).isoformat()
        expired_start = (TODAY - timedelta(days=40)).isoformat()
        expired_end = (TODAY - timedelta(days=1)).isoformat()

        active = create_contract(
            "contract-active",
            customer,
            contractor_a.organization_id,
            contract_number=f"CTR-ACT-{SEED}",
            contract_status="active",
            start_date=active_start,
            end_date=active_end,
            work_type="repair",
            equipment_type="Насос",
            region="Москва",
            unit_id=customer_unit["id"],
            subject="Действующий контракт для routing baseline",
        )
        inactive = create_contract(
            "contract-inactive",
            customer,
            contractor_a.organization_id,
            contract_number=f"CTR-INACTIVE-{SEED}",
            contract_status="inactive",
            start_date=future_start,
            end_date=future_end,
            work_type="repair",
            equipment_type="Насос",
            region="Москва",
            unit_id=customer_unit["id"],
            subject="Неактивный контракт вне eligibility",
        )
        expired = create_contract(
            "contract-expired",
            customer,
            contractor_a.organization_id,
            contract_number=f"CTR-EXP-{SEED}",
            contract_status="expired",
            start_date=expired_start,
            end_date=expired_end,
            work_type="repair",
            equipment_type="Насос",
            region="Москва",
            unit_id=customer_unit["id"],
            subject="Истекший контракт вне eligibility",
        )
        other = create_contract(
            "contract-other-contractor",
            customer,
            contractor_b.organization_id,
            contract_number=f"CTR-OTHER-{SEED}",
            contract_status="active",
            start_date=active_start,
            end_date=active_end,
            work_type="repair",
            equipment_type="Насос",
            region="Казань",
            unit_id=customer_unit["id"],
            subject="Другой подрядчик вне routing match",
        )

        customer_list = expect_ok("GET", "/api/v1/agreements", expected_status=200, token=customer.session_token)
        contractor_a_list = expect_ok("GET", "/api/v1/agreements", expected_status=200, token=contractor_a.session_token)
        contractor_b_list = expect_ok("GET", "/api/v1/agreements", expected_status=200, token=contractor_b.session_token)
        write_json("customer-contract-list", customer_list)
        write_json("contractor-alpha-contract-list", contractor_a_list)
        write_json("contractor-bravo-contract-list", contractor_b_list)

        routing = expect_ok(
            "POST",
            "/api/v1/agreements/routing/resolve",
            expected_status=200,
            token=customer.session_token,
            body={
                "unitId": customer_unit["id"],
                "workType": "repair",
                "equipmentType": "Насос",
                "region": "Москва",
            },
        )
        write_json("routing-resolve", routing)

        contractor_forbidden = expect_error(
            "GET",
            f"/api/v1/agreements/{other['id']}",
            expected_status=403,
            token=contractor_a.session_token,
        )
        write_json("contractor-alpha-forbidden-other-contract", contractor_forbidden)

        customer_current = expect_ok("GET", "/api/v1/sessions/current", expected_status=200, token=customer.session_token)
        contractor_a_current = expect_ok(
            "GET",
            "/api/v1/sessions/current",
            expected_status=200,
            token=contractor_a.session_token,
        )
        write_json("customer-session-current-post-contracts", customer_current)
        write_json("contractor-alpha-session-current-post-contracts", contractor_a_current)

        customer_login = expect_ok(
            "POST",
            "/api/v1/sessions",
            expected_status=200,
            body={"email": customer.email, "password": customer.password},
        )
        contractor_login = expect_ok(
            "POST",
            "/api/v1/sessions",
            expected_status=200,
            body={"email": contractor_a.email, "password": contractor_a.password},
        )
        write_json("customer-login-post-contracts", customer_login)
        write_json("contractor-alpha-login-post-contracts", contractor_login)

        customer_numbers = {item["contractNumber"] for item in customer_list["data"]}
        contractor_a_numbers = {item["contractNumber"] for item in contractor_a_list["data"]}
        contractor_b_numbers = {item["contractNumber"] for item in contractor_b_list["data"]}
        routing_matches = routing["data"]["matches"]

        checks = {
            "contractStatusBaseline": sorted(item["contractStatus"] for item in customer_list["data"]),
            "customerRegistryCount": len(customer_list["data"]),
            "contractorOptions": sorted(option["name"] for option in contractor_options),
            "routingMatchContractNumbers": [item["contract"]["contractNumber"] for item in routing_matches],
            "routingMatchContractorIds": [item["contractor"]["id"] for item in routing_matches],
            "customerLandingPath": customer_login["data"]["workspace"]["landingPath"],
            "contractorLandingPath": contractor_login["data"]["workspace"]["landingPath"],
            "customerWorkspaceScopeType": customer_current["data"]["workspace"]["scopeType"],
            "contractorWorkspaceScopeType": contractor_a_current["data"]["workspace"]["scopeType"],
            "contractorAlphaVisibleContracts": sorted(contractor_a_numbers),
            "contractorBravoVisibleContracts": sorted(contractor_b_numbers),
            "forbiddenOtherContractError": contractor_forbidden.get("error"),
        }

        assert customer_numbers == {
            active["contractNumber"],
            inactive["contractNumber"],
            expired["contractNumber"],
            other["contractNumber"],
        }
        assert contractor_a_numbers == {
            active["contractNumber"],
            inactive["contractNumber"],
            expired["contractNumber"],
        }
        assert contractor_b_numbers == {other["contractNumber"]}
        assert other["contractNumber"] not in contractor_a_numbers
        assert routing_matches, routing
        assert len(routing_matches) == 1, routing
        assert routing_matches[0]["contract"]["contractNumber"] == active["contractNumber"], routing
        assert routing_matches[0]["contractor"]["id"] == contractor_a.organization_id, routing
        assert customer_login["data"]["workspace"]["landingPath"] == "/company", customer_login
        assert contractor_login["data"]["workspace"]["landingPath"] == "/contracts", contractor_login
        assert customer_current["data"]["organization"]["roleTitle"] == "customer", customer_current
        assert contractor_a_current["data"]["organization"]["roleTitle"] == "contractor", contractor_a_current
        assert contractor_forbidden.get("error") == "forbidden", contractor_forbidden

        summary = {
            "seed": SEED,
            "customerOrganizationId": customer.organization_id,
            "contractorAlphaOrganizationId": contractor_a.organization_id,
            "contractorBravoOrganizationId": contractor_b.organization_id,
            "activeContractId": active["id"],
            "inactiveContractId": inactive["id"],
            "expiredContractId": expired["id"],
            "otherContractId": other["id"],
            "statuses": statuses,
            "checks": checks,
        }
        write_json("proof-summary", summary)
        log_lines.append("slice-003 contracts proof: PASS")
        log_lines.append(json.dumps(summary, ensure_ascii=False))
        write_log("proof", "\n".join(log_lines) + "\n")
        print(json.dumps(summary, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001
        log_lines.append(f"slice-003 contracts proof: FAIL: {error}")
        if isinstance(error, HttpFailure):
            log_lines.append(
                json.dumps(
                    {
                        "method": error.method,
                        "path": error.path,
                        "status": error.status,
                        "payload": error.payload,
                    },
                    ensure_ascii=False,
                )
            )
        write_log("proof", "\n".join(log_lines) + "\n")
        print("\n".join(log_lines), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
