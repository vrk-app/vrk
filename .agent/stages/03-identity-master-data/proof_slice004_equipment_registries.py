#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any


API_BASE = os.getenv("VRK_API_BASE_URL", "http://127.0.0.1:18080")
PLATFORM_ADMIN_SECRET = os.getenv("PLATFORM_ADMIN_SHARED_SECRET", "stage03-platform-admin-secret")
ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parents[2]
RAW_DIR = ROOT / "raw"
TODAY = date.today()
STAMP = TODAY.isoformat()
SEED = os.getenv("VRK_STAGE03_SLICE004_SEED", str(int(time.time())))


@dataclass
class OrgContext:
    label: str
    organization_id: str
    division_id: str
    division_name: str
    unit_id: str
    unit_name: str
    email: str
    password: str
    session_token: str


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
    path = RAW_DIR / f"slice-004-direct-{name}-{STAMP}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def write_log(name: str, text: str) -> Path:
    path = RAW_DIR / f"slice-004-direct-{name}-{STAMP}.log"
    path.write_text(text, encoding="utf-8")
    return path


def request_json(
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    platform_admin: bool = False,
) -> tuple[int, Any]:
    url = f"{API_BASE}{path}"
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if platform_admin:
        headers["X-VRK-Platform-Admin-Secret"] = PLATFORM_ADMIN_SECRET

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
    platform_admin: bool = False,
    expected_status: int,
) -> dict[str, Any]:
    status, payload = request_json(method, path, body=body, token=token, platform_admin=platform_admin)
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
    platform_admin: bool = False,
    expected_status: int,
) -> dict[str, Any]:
    status, payload = request_json(method, path, body=body, token=token, platform_admin=platform_admin)
    if status != expected_status:
        raise HttpFailure(method, path, status, payload)
    return payload


def run_psql(sql: str) -> str:
    command = [
        "docker",
        "compose",
        "-f",
        "compose.platform.yml",
        "exec",
        "-T",
        "db",
        "psql",
        "-U",
        "postgres",
        "-d",
        "db",
        "-At",
        "-F",
        "|",
        "-c",
        sql,
    ]
    result = subprocess.run(
        command,
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def create_org(label: str) -> OrgContext:
    email = f"{label}-{SEED}@vrk.local"
    password = f"stage03-{label}-{SEED}"
    org_name = f"ВРК {label} {SEED}"

    shell = expect_ok(
        "POST",
        "/api/v1/platform/organization-shells",
        platform_admin=True,
        expected_status=201,
        body={
            "organizationName": org_name,
            "organizationRole": "customer",
            "firstAdminName": f"{label.title()} Admin {SEED}",
            "firstAdminEmail": email,
        },
    )
    write_json(f"{label}-create-shell", shell)
    invite_token = shell["data"]["inviteToken"]

    inspect = expect_ok("GET", f"/api/v1/first-admin-invites/{invite_token}", expected_status=200)
    write_json(f"{label}-inspect-invite", inspect)

    accepted = expect_ok(
        "POST",
        f"/api/v1/first-admin-invites/{invite_token}/accept",
        expected_status=200,
        body={"password": password},
    )
    write_json(f"{label}-accept-first-admin", accepted)
    session_token = accepted["data"]["sessionToken"]

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
            "structureMode": "division",
            "division": {
                "type": "Филиал",
                "name": f"{label.title()} Подразделение {SEED}",
            },
            "unit": {
                "type": "Юнит",
                "name": f"{label.title()} Юнит 01 {SEED}",
            },
        },
    )
    write_json(f"{label}-launch", launch)
    launched = launch["data"]
    current = expect_ok("GET", "/api/v1/sessions/current", expected_status=200, token=launched["sessionToken"])
    write_json(f"{label}-session-current", current)

    division = current["data"]["divisions"][0]
    unit = current["data"]["units"][0]

    return OrgContext(
        label=label,
        organization_id=current["data"]["organization"]["id"],
        division_id=division["id"],
        division_name=division["name"],
        unit_id=unit["id"],
        unit_name=unit["name"],
        email=email,
        password=password,
        session_token=launched["sessionToken"],
    )


def create_scoped_employee(
    customer: OrgContext,
    *,
    label: str,
    scope_type: str,
    scope_id: str,
) -> dict[str, str]:
    email = f"{label}-{SEED}@vrk.local"
    password = f"stage03-{label}-{SEED}"

    created = expect_ok(
        "POST",
        "/api/v1/employee-invites",
        expected_status=201,
        token=customer.session_token,
        body={
            "fullName": f"{label.title()} Employee {SEED}",
            "email": email,
            "roleTemplate": "unit_operator" if scope_type == "unit" else "division_manager",
            "scopeType": scope_type,
            "scopeId": scope_id,
            "expiresAt": (TODAY + timedelta(days=7)).isoformat() + "T12:00:00Z",
        },
    )
    write_json(f"{label}-invite-created", created)

    sent = expect_ok(
        "POST",
        f"/api/v1/employee-invites/{created['data']['id']}/send",
        expected_status=200,
        token=customer.session_token,
    )
    write_json(f"{label}-invite-sent", sent)

    invite_token = sent["data"]["inviteToken"]
    inspect = expect_ok("GET", f"/api/v1/invites/{invite_token}", expected_status=200)
    write_json(f"{label}-invite-inspect", inspect)

    accepted = expect_ok(
        "POST",
        f"/api/v1/invites/{invite_token}/accept",
        expected_status=200,
        body={"password": password},
    )
    write_json(f"{label}-invite-accept", accepted)

    current = expect_ok("GET", "/api/v1/sessions/current", expected_status=200, token=accepted["data"]["sessionToken"])
    write_json(f"{label}-session-current", current)

    return {
        "email": email,
        "password": password,
        "sessionToken": accepted["data"]["sessionToken"],
    }


def insert_second_unit(customer: OrgContext) -> dict[str, str]:
    sql = f"""
INSERT INTO auth_units (
    organization_id,
    division_id,
    unit_type,
    name,
    address,
    manager_name,
    contacts
) VALUES (
    '{customer.organization_id}'::uuid,
    '{customer.division_id}'::uuid,
    'Юнит',
    'Второй юнит {SEED}',
    'г. Москва, площадка 2',
    'Старший инженер',
    '+7 (999) 000-00-02'
)
RETURNING id, name;
""".strip()
    output = run_psql(sql)
    unit_id, unit_name = output.split("|", 1)
    payload = {"id": unit_id, "name": unit_name}
    write_json("second-unit", payload)
    return payload


def create_equipment(
    token: str,
    *,
    unit_id: str,
    manufacturer: str,
    classification: str,
    model: str,
    full_name: str,
    factory_number: str,
    year: int,
) -> dict[str, Any]:
    payload = expect_ok(
        "POST",
        "/api/v1/equipment",
        expected_status=201,
        token=token,
        body={
            "unitId": unit_id,
            "manufacturer": manufacturer,
            "classification": classification,
            "model": model,
            "fullName": full_name,
            "factoryNumber": factory_number,
            "inventoryNumber": f"INV-{factory_number}",
            "manufactureYear": year,
            "status": "active",
            "comment": f"slice-004 equipment {factory_number}",
        },
    )
    return payload["data"]


def create_standard(
    token: str,
    *,
    standard_type: str,
    model: str,
    identifier: str,
    scope_type: str,
    scope_id: str | None,
    metrological_characteristics: str,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "standardType": standard_type,
        "model": model,
        "identifier": identifier,
        "status": "active",
        "metrologicalCharacteristics": metrological_characteristics,
    }
    if scope_type == "division":
        body["divisionId"] = scope_id
    elif scope_type == "unit":
        body["unitId"] = scope_id

    payload = expect_ok(
        "POST",
        "/api/v1/standards",
        expected_status=201,
        token=token,
        body=body,
    )
    return payload["data"]


def create_measuring_instrument(
    token: str,
    *,
    unit_id: str,
    placement_kind: str,
    name: str,
    instrument_type: str,
    model: str,
    registration_number: str,
    serial_number: str,
    equipment_id: str | None = None,
    standard_ids: list[str] | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "unitId": unit_id,
        "placementKind": placement_kind,
        "name": name,
        "instrumentType": instrument_type,
        "model": model,
        "registrationNumber": registration_number,
        "serialNumber": serial_number,
        "status": "active",
        "standardIds": standard_ids or [],
    }
    if equipment_id is not None:
        body["equipmentId"] = equipment_id

    payload = expect_ok(
        "POST",
        "/api/v1/measuring-instruments",
        expected_status=201,
        token=token,
        body=body,
    )
    return payload["data"]


def names(items: list[dict[str, Any]], field: str) -> list[str]:
    return sorted(item[field] for item in items)


def main() -> int:
    ensure_raw_dir()
    log_lines: list[str] = []

    try:
        customer = create_org("customer-equipment")
        second_unit = insert_second_unit(customer)

        admin_current = expect_ok("GET", "/api/v1/sessions/current", expected_status=200, token=customer.session_token)
        write_json("admin-session-current-post-unit-seed", admin_current)

        division_employee = create_scoped_employee(
            customer,
            label="division-registry",
            scope_type="division",
            scope_id=customer.division_id,
        )
        unit_employee = create_scoped_employee(
            customer,
            label="unit-registry",
            scope_type="unit",
            scope_id=customer.unit_id,
        )

        equipment_zero = create_equipment(
            customer.session_token,
            unit_id=customer.unit_id,
            manufacturer="Трансмаш",
            classification="Насос",
            model="NP-100",
            full_name=f"Насос без СИ {SEED}",
            factory_number=f"E0-{SEED}",
            year=2021,
        )
        equipment_primary = create_equipment(
            customer.session_token,
            unit_id=customer.unit_id,
            manufacturer="Трансмаш",
            classification="Компрессор",
            model="KM-200",
            full_name=f"Компрессор 01 {SEED}",
            factory_number=f"E1-{SEED}",
            year=2022,
        )
        equipment_secondary = create_equipment(
            customer.session_token,
            unit_id=second_unit["id"],
            manufacturer="Трансмаш",
            classification="Компрессор",
            model="KM-300",
            full_name=f"Компрессор 02 {SEED}",
            factory_number=f"E2-{SEED}",
            year=2023,
        )
        write_json("equipment-zero", equipment_zero)
        write_json("equipment-primary", equipment_primary)
        write_json("equipment-secondary", equipment_secondary)

        shared_standard = create_standard(
            customer.session_token,
            standard_type="Эталон давления",
            model="STD-ORG",
            identifier=f"STD-ORG-{SEED}",
            scope_type="organization",
            scope_id=None,
            metrological_characteristics="0.1 кПа, общий контур организации",
        )
        division_standard = create_standard(
            customer.session_token,
            standard_type="Эталон температуры",
            model="STD-SUB",
            identifier=f"STD-SUB-{SEED}",
            scope_type="division",
            scope_id=customer.division_id,
            metrological_characteristics="0.3°C, контур подразделения",
        )
        unit_one_standard = create_standard(
            customer.session_token,
            standard_type="Эталон расхода",
            model="STD-U1",
            identifier=f"STD-U1-{SEED}",
            scope_type="unit",
            scope_id=customer.unit_id,
            metrological_characteristics="1.5 л/мин, юнит 01",
        )
        unit_two_standard = create_standard(
            customer.session_token,
            standard_type="Эталон расхода",
            model="STD-U2",
            identifier=f"STD-U2-{SEED}",
            scope_type="unit",
            scope_id=second_unit["id"],
            metrological_characteristics="2.0 л/мин, юнит 02",
        )
        write_json("standard-shared", shared_standard)
        write_json("standard-division", division_standard)
        write_json("standard-unit-one", unit_one_standard)
        write_json("standard-unit-two", unit_two_standard)

        built_in_primary = create_measuring_instrument(
            customer.session_token,
            unit_id=customer.unit_id,
            placement_kind="built_in",
            equipment_id=equipment_primary["id"],
            name=f"Манометр built-in {SEED}",
            instrument_type="Манометр",
            model="MI-B1",
            registration_number=f"MI-B1-{SEED}",
            serial_number=f"SER-B1-{SEED}",
            standard_ids=[shared_standard["id"], division_standard["id"]],
        )
        standalone_unit = create_measuring_instrument(
            customer.session_token,
            unit_id=customer.unit_id,
            placement_kind="standalone",
            name=f"Standalone СИ {SEED}",
            instrument_type="Термометр",
            model="MI-S1",
            registration_number=f"MI-S1-{SEED}",
            serial_number=f"SER-S1-{SEED}",
        )
        built_in_secondary = create_measuring_instrument(
            customer.session_token,
            unit_id=second_unit["id"],
            placement_kind="built_in",
            equipment_id=equipment_secondary["id"],
            name=f"Манометр вторичный {SEED}",
            instrument_type="Манометр",
            model="MI-B2",
            registration_number=f"MI-B2-{SEED}",
            serial_number=f"SER-B2-{SEED}",
            standard_ids=[shared_standard["id"], unit_two_standard["id"]],
        )
        write_json("mi-built-in-primary", built_in_primary)
        write_json("mi-standalone", standalone_unit)
        write_json("mi-built-in-secondary", built_in_secondary)

        admin_equipment = expect_ok("GET", "/api/v1/equipment", expected_status=200, token=customer.session_token)
        admin_measuring_instruments = expect_ok(
            "GET",
            "/api/v1/measuring-instruments",
            expected_status=200,
            token=customer.session_token,
        )
        admin_standards = expect_ok("GET", "/api/v1/standards", expected_status=200, token=customer.session_token)
        admin_agreements = expect_ok("GET", "/api/v1/agreements", expected_status=200, token=customer.session_token)
        write_json("admin-equipment-list", admin_equipment)
        write_json("admin-measuring-instruments-list", admin_measuring_instruments)
        write_json("admin-standards-list", admin_standards)
        write_json("admin-agreements-list", admin_agreements)

        division_equipment = expect_ok(
            "GET",
            "/api/v1/equipment",
            expected_status=200,
            token=division_employee["sessionToken"],
        )
        division_measuring_instruments = expect_ok(
            "GET",
            "/api/v1/measuring-instruments",
            expected_status=200,
            token=division_employee["sessionToken"],
        )
        division_standards = expect_ok(
            "GET",
            "/api/v1/standards",
            expected_status=200,
            token=division_employee["sessionToken"],
        )
        write_json("division-equipment-list", division_equipment)
        write_json("division-measuring-instruments-list", division_measuring_instruments)
        write_json("division-standards-list", division_standards)

        unit_equipment = expect_ok("GET", "/api/v1/equipment", expected_status=200, token=unit_employee["sessionToken"])
        unit_measuring_instruments = expect_ok(
            "GET",
            "/api/v1/measuring-instruments",
            expected_status=200,
            token=unit_employee["sessionToken"],
        )
        unit_standards = expect_ok("GET", "/api/v1/standards", expected_status=200, token=unit_employee["sessionToken"])
        write_json("unit-equipment-list", unit_equipment)
        write_json("unit-measuring-instruments-list", unit_measuring_instruments)
        write_json("unit-standards-list", unit_standards)

        unit_forbidden_equipment = expect_error(
            "GET",
            f"/api/v1/equipment/{equipment_secondary['id']}",
            expected_status=403,
            token=unit_employee["sessionToken"],
        )
        unit_forbidden_mi = expect_error(
            "GET",
            f"/api/v1/measuring-instruments/{built_in_secondary['id']}",
            expected_status=403,
            token=unit_employee["sessionToken"],
        )
        unit_forbidden_standard = expect_error(
            "GET",
            f"/api/v1/standards/{shared_standard['id']}",
            expected_status=403,
            token=unit_employee["sessionToken"],
        )
        write_json("unit-forbidden-equipment", unit_forbidden_equipment)
        write_json("unit-forbidden-mi", unit_forbidden_mi)
        write_json("unit-forbidden-standard", unit_forbidden_standard)

        admin_equipment_items = admin_equipment["data"]
        admin_mi_items = admin_measuring_instruments["data"]
        admin_standard_items = admin_standards["data"]
        division_standard_ids = {item["id"] for item in division_standards["data"]}
        unit_equipment_names = names(unit_equipment["data"], "fullName")
        unit_mi_names = names(unit_measuring_instruments["data"], "name")
        unit_standard_ids = {item["id"] for item in unit_standards["data"]}

        equipment_counts = {item["id"]: item["measuringInstrumentCount"] for item in admin_equipment_items}
        standard_link_counts = {item["id"]: item["linkedMeasuringInstruments"] for item in admin_standard_items}
        mi_by_id = {item["id"]: item for item in admin_mi_items}

        checks = {
            "adminEquipmentCount": len(admin_equipment_items),
            "adminMeasuringInstrumentCount": len(admin_mi_items),
            "adminStandardCount": len(admin_standard_items),
            "equipmentWithoutMI": equipment_counts[equipment_zero["id"]] == 0,
            "equipmentWithMI": equipment_counts[equipment_primary["id"]] == 1 and equipment_counts[equipment_secondary["id"]] == 1,
            "builtInMI": mi_by_id[built_in_primary["id"]]["placementKind"] == "built_in",
            "standaloneMI": mi_by_id[standalone_unit["id"]]["placementKind"] == "standalone"
            and mi_by_id[standalone_unit["id"]].get("equipment") is None,
            "standaloneMIHasZeroStandards": len(mi_by_id[standalone_unit["id"]].get("standards") or []) == 0,
            "sharedStandardReusable": standard_link_counts[shared_standard["id"]] == 2,
            "divisionUserSeesBothUnits": {
                equipment_primary["fullName"],
                equipment_secondary["fullName"],
            }.issubset(set(names(division_equipment["data"], "fullName"))),
            "divisionUserNoOrgStandardLeak": shared_standard["id"] not in division_standard_ids,
            "unitUserVisibleEquipment": unit_equipment_names,
            "unitUserVisibleMI": unit_mi_names,
            "unitUserVisibleStandardIds": sorted(unit_standard_ids),
            "unitUserNoEquipmentLeak": equipment_secondary["fullName"] not in unit_equipment_names,
            "unitUserNoMILLeak": built_in_secondary["name"] not in unit_mi_names,
            "unitUserNoBroaderStandardLeak": shared_standard["id"] not in unit_standard_ids
            and division_standard["id"] not in unit_standard_ids
            and unit_two_standard["id"] not in unit_standard_ids,
            "unitUserKeepsOwnStandard": unit_one_standard["id"] in unit_standard_ids,
            "unitForbiddenEquipment": unit_forbidden_equipment.get("error") == "forbidden",
            "unitForbiddenMI": unit_forbidden_mi.get("error") == "forbidden",
            "unitForbiddenStandard": unit_forbidden_standard.get("error") == "forbidden",
            "contractsBaselineReachable": len(admin_agreements["data"]) == 0,
        }

        assert len(admin_equipment_items) == 3, admin_equipment
        assert len(admin_mi_items) == 3, admin_measuring_instruments
        assert len(admin_standard_items) == 4, admin_standards
        assert checks["equipmentWithoutMI"], admin_equipment
        assert checks["equipmentWithMI"], admin_equipment
        assert checks["builtInMI"], built_in_primary
        assert checks["standaloneMI"], standalone_unit
        assert checks["standaloneMIHasZeroStandards"], standalone_unit
        assert checks["sharedStandardReusable"], admin_standards
        assert checks["divisionUserSeesBothUnits"], division_equipment
        assert checks["divisionUserNoOrgStandardLeak"], division_standards
        assert checks["unitUserNoEquipmentLeak"], unit_equipment
        assert checks["unitUserNoMILLeak"], unit_measuring_instruments
        assert checks["unitUserNoBroaderStandardLeak"], unit_standards
        assert checks["unitUserKeepsOwnStandard"], unit_standards
        assert checks["unitForbiddenEquipment"], unit_forbidden_equipment
        assert checks["unitForbiddenMI"], unit_forbidden_mi
        assert checks["unitForbiddenStandard"], unit_forbidden_standard

        summary = {
            "seed": SEED,
            "organizationId": customer.organization_id,
            "divisionId": customer.division_id,
            "unitOneId": customer.unit_id,
            "unitTwoId": second_unit["id"],
            "equipmentIds": {
                "zeroMI": equipment_zero["id"],
                "primary": equipment_primary["id"],
                "secondary": equipment_secondary["id"],
            },
            "measuringInstrumentIds": {
                "builtInPrimary": built_in_primary["id"],
                "standalone": standalone_unit["id"],
                "builtInSecondary": built_in_secondary["id"],
            },
            "standardIds": {
                "shared": shared_standard["id"],
                "division": division_standard["id"],
                "unitOne": unit_one_standard["id"],
                "unitTwo": unit_two_standard["id"],
            },
            "checks": checks,
        }
        write_json("proof-summary", summary)
        log_lines.append("slice-004 equipment registries proof: PASS")
        log_lines.append(json.dumps(summary, ensure_ascii=False))
        write_log("proof", "\n".join(log_lines) + "\n")
        print(json.dumps(summary, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001
        log_lines.append(f"slice-004 equipment registries proof: FAIL: {error}")
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
