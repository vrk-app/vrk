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
SEED = os.getenv("VRK_STAGE03_SLICE005_SEED", str(int(time.time())))


@dataclass
class OrgContext:
    label: str
    organization_id: str
    subdivision_id: str
    subdivision_name: str
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
    path = RAW_DIR / f"slice-005-direct-{name}-{STAMP}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def write_log(name: str, text: str) -> Path:
    path = RAW_DIR / f"slice-005-direct-{name}-{STAMP}.log"
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
            "legalAddress": f"г. Москва, ул. {label}, д. 5",
            "contactEmail": email,
            "contactPhone": "+7 (999) 123-45-67",
            "structureMode": "subdivision",
            "subdivision": {
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

    subdivision = current["data"]["subdivisions"][0]
    unit = current["data"]["units"][0]

    return OrgContext(
        label=label,
        organization_id=current["data"]["organization"]["id"],
        subdivision_id=subdivision["id"],
        subdivision_name=subdivision["name"],
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
            "roleTemplate": "unit_operator" if scope_type == "unit" else "subdivision_manager",
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
    subdivision_id,
    unit_type,
    name,
    code,
    address,
    manager_name,
    contacts
) VALUES (
    '{customer.organization_id}'::uuid,
    '{customer.subdivision_id}'::uuid,
    'Юнит',
    'Второй юнит {SEED}',
    'U2-{SEED}',
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
    status: str = "active",
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
            "status": status,
            "comment": f"slice-005 equipment {factory_number}",
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
    owner_label: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "standardType": standard_type,
        "model": model,
        "identifier": identifier,
        "metrologicalCharacteristics": metrological_characteristics,
    }
    if owner_label is not None:
        body["ownerLabel"] = owner_label
    if scope_type == "subdivision":
        body["subdivisionId"] = scope_id
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


def create_mi_journal(
    token: str,
    *,
    measuring_instrument_id: str,
    operation_type: str,
    operation_date: str,
    document_number: str,
    executor_organization: str,
    valid_until: str | None = None,
    attachment_url: str | None = None,
    comment: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "operationType": operation_type,
        "operationDate": operation_date,
        "documentNumber": document_number,
        "executorOrganization": executor_organization,
    }
    if valid_until is not None:
        body["validUntil"] = valid_until
    if attachment_url is not None:
        body["attachmentUrl"] = attachment_url
    if comment is not None:
        body["comment"] = comment

    payload = expect_ok(
        "POST",
        f"/api/v1/measuring-instruments/{measuring_instrument_id}/journals",
        expected_status=201,
        token=token,
        body=body,
    )
    return payload["data"]


def create_standard_journal(
    token: str,
    *,
    standard_id: str,
    operation_type: str,
    operation_date: str,
    document_number: str,
    executor_organization: str,
    valid_until: str | None = None,
    attachment_url: str | None = None,
    comment: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "operationType": operation_type,
        "operationDate": operation_date,
        "documentNumber": document_number,
        "executorOrganization": executor_organization,
    }
    if valid_until is not None:
        body["validUntil"] = valid_until
    if attachment_url is not None:
        body["attachmentUrl"] = attachment_url
    if comment is not None:
        body["comment"] = comment

    payload = expect_ok(
        "POST",
        f"/api/v1/standards/{standard_id}/journals",
        expected_status=201,
        token=token,
        body=body,
    )
    return payload["data"]


def archive_entity(token: str, path: str) -> dict[str, Any]:
    payload = expect_ok("POST", path, expected_status=200, token=token)
    return payload["data"]


def list_registry(token: str, path: str, *, include_archived: bool = False) -> dict[str, Any]:
    search = "?includeArchived=true" if include_archived else ""
    return expect_ok("GET", f"{path}{search}", expected_status=200, token=token)


def get_record(token: str, path: str) -> dict[str, Any]:
    return expect_ok("GET", path, expected_status=200, token=token)


def names(items: list[dict[str, Any]], field: str) -> list[str]:
    return sorted(item[field] for item in items)


def find_by_id(items: list[dict[str, Any]], item_id: str) -> dict[str, Any]:
    for item in items:
        if item["id"] == item_id:
            return item
    raise AssertionError(f"item {item_id} not found")


def assert_archived_row(table: str, record_id: str) -> dict[str, str]:
    sql = f"""
SELECT
  COUNT(*)::text,
  COUNT(archived_at)::text,
  COALESCE(MAX(to_char(archived_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')), '')
FROM {table}
WHERE id = '{record_id}'::uuid;
""".strip()
    count, archived_count, archived_at = run_psql(sql).split("|", 2)
    assert count == "1", f"{table} row missing for {record_id}"
    assert archived_count == "1", f"{table} row is not archived for {record_id}"
    return {
        "table": table,
        "id": record_id,
        "count": count,
        "archivedCount": archived_count,
        "archivedAt": archived_at,
    }


def journal_count(subject_type: str, subject_id: str) -> int:
    sql = f"""
SELECT COUNT(*)::text
FROM registry_metrology_journal_entries
WHERE subject_type = '{subject_type}'
  AND subject_id = '{subject_id}'::uuid;
""".strip()
    return int(run_psql(sql))


def main() -> int:
    ensure_raw_dir()
    log_lines: list[str] = []

    try:
        customer = create_org("customer-metrology")
        second_unit = insert_second_unit(customer)
        admin_current = expect_ok("GET", "/api/v1/sessions/current", expected_status=200, token=customer.session_token)
        write_json("admin-session-current-post-unit-seed", admin_current)

        subdivision_employee = create_scoped_employee(
            customer,
            label="subdivision-metrology",
            scope_type="subdivision",
            scope_id=customer.subdivision_id,
        )
        unit_employee = create_scoped_employee(
            customer,
            label="unit-metrology",
            scope_type="unit",
            scope_id=customer.unit_id,
        )

        equipment_zero = create_equipment(
            customer.session_token,
            unit_id=customer.unit_id,
            manufacturer="Трансмаш",
            classification="Насос",
            model="EQ-ZERO",
            full_name=f"Насос без метрологии {SEED}",
            factory_number=f"EQ-ZERO-{SEED}",
            year=2021,
        )
        equipment_primary = create_equipment(
            customer.session_token,
            unit_id=customer.unit_id,
            manufacturer="Трансмаш",
            classification="Компрессор",
            model="EQ-PRM",
            full_name=f"Компрессор активный {SEED}",
            factory_number=f"EQ-PRM-{SEED}",
            year=2022,
        )
        equipment_secondary = create_equipment(
            customer.session_token,
            unit_id=second_unit["id"],
            manufacturer="Трансмаш",
            classification="Компрессор",
            model="EQ-SEC",
            full_name=f"Компрессор второй юнит {SEED}",
            factory_number=f"EQ-SEC-{SEED}",
            year=2023,
        )
        equipment_archive = create_equipment(
            customer.session_token,
            unit_id=customer.unit_id,
            manufacturer="Трансмаш",
            classification="Резерв",
            model="EQ-ARC",
            full_name=f"Оборудование в архив {SEED}",
            factory_number=f"EQ-ARC-{SEED}",
            year=2020,
        )
        write_json("equipment-zero", equipment_zero)
        write_json("equipment-primary", equipment_primary)
        write_json("equipment-secondary", equipment_secondary)
        write_json("equipment-archive-target", equipment_archive)

        shared_standard = create_standard(
            customer.session_token,
            standard_type="Эталон давления",
            model="STD-ORG",
            identifier=f"STD-ORG-{SEED}",
            scope_type="organization",
            scope_id=None,
            owner_label=f"Организация {SEED}",
            metrological_characteristics="0.1 кПа, общий контур организации",
        )
        subdivision_standard = create_standard(
            customer.session_token,
            standard_type="Эталон температуры",
            model="STD-SUB",
            identifier=f"STD-SUB-{SEED}",
            scope_type="subdivision",
            scope_id=customer.subdivision_id,
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
        archived_standard = create_standard(
            customer.session_token,
            standard_type="Эталон напряжения",
            model="STD-ARC",
            identifier=f"STD-ARC-{SEED}",
            scope_type="unit",
            scope_id=customer.unit_id,
            metrological_characteristics="0.5 В, архивный контур",
        )
        write_json("standard-shared", shared_standard)
        write_json("standard-subdivision", subdivision_standard)
        write_json("standard-unit-one", unit_one_standard)
        write_json("standard-unit-two", unit_two_standard)
        write_json("standard-archive-target", archived_standard)

        mi_primary = create_measuring_instrument(
            customer.session_token,
            unit_id=customer.unit_id,
            placement_kind="built_in",
            equipment_id=equipment_primary["id"],
            name=f"Манометр первичный {SEED}",
            instrument_type="Манометр",
            model="MI-PRM",
            registration_number=f"MI-PRM-{SEED}",
            serial_number=f"SER-PRM-{SEED}",
            standard_ids=[shared_standard["id"], unit_one_standard["id"]],
        )
        mi_secondary = create_measuring_instrument(
            customer.session_token,
            unit_id=second_unit["id"],
            placement_kind="built_in",
            equipment_id=equipment_secondary["id"],
            name=f"Манометр вторичный {SEED}",
            instrument_type="Манометр",
            model="MI-SEC",
            registration_number=f"MI-SEC-{SEED}",
            serial_number=f"SER-SEC-{SEED}",
            standard_ids=[shared_standard["id"], unit_two_standard["id"]],
        )
        mi_archive = create_measuring_instrument(
            customer.session_token,
            unit_id=customer.unit_id,
            placement_kind="standalone",
            name=f"Термометр архивный {SEED}",
            instrument_type="Термометр",
            model="MI-ARC",
            registration_number=f"MI-ARC-{SEED}",
            serial_number=f"SER-ARC-{SEED}",
        )
        write_json("mi-primary", mi_primary)
        write_json("mi-secondary", mi_secondary)
        write_json("mi-archive-target", mi_archive)

        assert mi_primary["status"] == "inactive", mi_primary
        assert unit_one_standard["status"] == "inactive", unit_one_standard
        assert archived_standard["status"] == "inactive", archived_standard

        mi_primary_old = create_mi_journal(
            customer.session_token,
            measuring_instrument_id=mi_primary["id"],
            operation_type="verification",
            operation_date="2026-01-10",
            document_number=f"MI-OLD-{SEED}",
            valid_until="2026-08-31",
            executor_organization="ФБУ Ростест-Москва",
            attachment_url="https://files.vrk.local/mi-old.pdf",
            comment="Базовая поверка",
        )
        mi_primary_latest = create_mi_journal(
            customer.session_token,
            measuring_instrument_id=mi_primary["id"],
            operation_type="verification",
            operation_date="2026-03-20",
            document_number=f"MI-LATEST-{SEED}",
            valid_until="2026-12-31",
            executor_organization="ФБУ Ростест-Москва",
            attachment_url="https://files.vrk.local/mi-latest.pdf",
            comment="Актуальная поверка",
        )
        mi_secondary_journal = create_mi_journal(
            customer.session_token,
            measuring_instrument_id=mi_secondary["id"],
            operation_type="verification",
            operation_date="2026-02-11",
            document_number=f"MI-SEC-{SEED}",
            valid_until="2027-01-31",
            executor_organization="ФБУ Ростест-Москва",
            comment="Поверка второго юнита",
        )
        mi_archive_old = create_mi_journal(
            customer.session_token,
            measuring_instrument_id=mi_archive["id"],
            operation_type="verification",
            operation_date="2026-02-01",
            document_number=f"MI-ARC-OLD-{SEED}",
            valid_until="2026-06-30",
            executor_organization="ФБУ Ростест-Москва",
            comment="Последняя поверка перед приостановкой",
        )
        mi_archive_latest = create_mi_journal(
            customer.session_token,
            measuring_instrument_id=mi_archive["id"],
            operation_type="suspension",
            operation_date="2026-04-05",
            document_number=f"MI-ARC-SUSP-{SEED}",
            executor_organization="Внутренний метролог",
            comment="Эксплуатация приостановлена",
        )
        write_json("mi-primary-journal-old", mi_primary_old)
        write_json("mi-primary-journal-latest", mi_primary_latest)
        write_json("mi-secondary-journal", mi_secondary_journal)
        write_json("mi-archive-journal-old", mi_archive_old)
        write_json("mi-archive-journal-latest", mi_archive_latest)

        unit_one_standard_old = create_standard_journal(
            customer.session_token,
            standard_id=unit_one_standard["id"],
            operation_type="verification",
            operation_date="2026-02-15",
            document_number=f"STD-U1-OLD-{SEED}",
            valid_until="2026-11-30",
            executor_organization="ФБУ Ростест-Москва",
            attachment_url="https://files.vrk.local/std-u1-old.pdf",
            comment="До вывода из эксплуатации",
        )
        unit_one_standard_latest = create_standard_journal(
            customer.session_token,
            standard_id=unit_one_standard["id"],
            operation_type="decommission",
            operation_date="2026-04-01",
            document_number=f"STD-U1-RET-{SEED}",
            executor_organization="Главный метролог",
            comment="Эталон выведен из эксплуатации",
        )
        unit_two_standard_journal = create_standard_journal(
            customer.session_token,
            standard_id=unit_two_standard["id"],
            operation_type="verification",
            operation_date="2026-02-20",
            document_number=f"STD-U2-ACT-{SEED}",
            valid_until="2027-02-20",
            executor_organization="ФБУ Ростест-Москва",
            comment="Подтверждение для второго юнита",
        )
        archived_standard_journal = create_standard_journal(
            customer.session_token,
            standard_id=archived_standard["id"],
            operation_type="verification",
            operation_date="2026-03-01",
            document_number=f"STD-ARC-ACT-{SEED}",
            valid_until="2026-10-31",
            executor_organization="ФБУ Ростест-Москва",
            comment="Архивный эталон с сохраненной историей",
        )
        write_json("standard-unit-one-journal-old", unit_one_standard_old)
        write_json("standard-unit-one-journal-latest", unit_one_standard_latest)
        write_json("standard-unit-two-journal", unit_two_standard_journal)
        write_json("standard-archive-journal", archived_standard_journal)

        mi_primary_state = get_record(customer.session_token, f"/api/v1/measuring-instruments/{mi_primary['id']}")
        mi_archive_state = get_record(customer.session_token, f"/api/v1/measuring-instruments/{mi_archive['id']}")
        unit_one_standard_state = get_record(customer.session_token, f"/api/v1/standards/{unit_one_standard['id']}")
        archived_standard_state = get_record(customer.session_token, f"/api/v1/standards/{archived_standard['id']}")
        write_json("mi-primary-state", mi_primary_state)
        write_json("mi-archive-state-pre-archive", mi_archive_state)
        write_json("standard-unit-one-state", unit_one_standard_state)
        write_json("standard-archive-state-pre-archive", archived_standard_state)

        archived_equipment_payload = archive_entity(customer.session_token, f"/api/v1/equipment/{equipment_archive['id']}/archive")
        archived_mi_payload = archive_entity(customer.session_token, f"/api/v1/measuring-instruments/{mi_archive['id']}/archive")
        archived_standard_payload = archive_entity(customer.session_token, f"/api/v1/standards/{archived_standard['id']}/archive")
        write_json("equipment-archive-result", archived_equipment_payload)
        write_json("mi-archive-result", archived_mi_payload)
        write_json("standard-archive-result", archived_standard_payload)

        archived_mi_mutation_error = expect_error(
            "POST",
            f"/api/v1/measuring-instruments/{mi_archive['id']}/journals",
            expected_status=400,
            token=customer.session_token,
            body={
                "operationType": "verification",
                "operationDate": "2026-05-01",
                "documentNumber": f"MI-ARC-BLOCK-{SEED}",
                "executorOrganization": "ФБУ Ростест-Москва",
            },
        )
        archived_standard_mutation_error = expect_error(
            "POST",
            f"/api/v1/standards/{archived_standard['id']}/journals",
            expected_status=400,
            token=customer.session_token,
            body={
                "operationType": "verification",
                "operationDate": "2026-05-01",
                "documentNumber": f"STD-ARC-BLOCK-{SEED}",
                "executorOrganization": "ФБУ Ростест-Москва",
            },
        )
        write_json("mi-archive-mutation-error", archived_mi_mutation_error)
        write_json("standard-archive-mutation-error", archived_standard_mutation_error)

        admin_equipment = list_registry(customer.session_token, "/api/v1/equipment")
        admin_equipment_archived = list_registry(customer.session_token, "/api/v1/equipment", include_archived=True)
        admin_measuring_instruments = list_registry(customer.session_token, "/api/v1/measuring-instruments")
        admin_measuring_instruments_archived = list_registry(
            customer.session_token,
            "/api/v1/measuring-instruments",
            include_archived=True,
        )
        admin_standards = list_registry(customer.session_token, "/api/v1/standards")
        admin_standards_archived = list_registry(customer.session_token, "/api/v1/standards", include_archived=True)
        admin_agreements = expect_ok("GET", "/api/v1/agreements", expected_status=200, token=customer.session_token)
        write_json("admin-equipment-list", admin_equipment)
        write_json("admin-equipment-list-include-archived", admin_equipment_archived)
        write_json("admin-measuring-instruments-list", admin_measuring_instruments)
        write_json("admin-measuring-instruments-list-include-archived", admin_measuring_instruments_archived)
        write_json("admin-standards-list", admin_standards)
        write_json("admin-standards-list-include-archived", admin_standards_archived)
        write_json("admin-agreements-list", admin_agreements)

        subdivision_equipment_archived = list_registry(
            subdivision_employee["sessionToken"],
            "/api/v1/equipment",
            include_archived=True,
        )
        subdivision_measuring_instruments_archived = list_registry(
            subdivision_employee["sessionToken"],
            "/api/v1/measuring-instruments",
            include_archived=True,
        )
        subdivision_standards_archived = list_registry(
            subdivision_employee["sessionToken"],
            "/api/v1/standards",
            include_archived=True,
        )
        subdivision_mi_secondary_journals = expect_ok(
            "GET",
            f"/api/v1/measuring-instruments/{mi_secondary['id']}/journals",
            expected_status=200,
            token=subdivision_employee["sessionToken"],
        )
        subdivision_standard_unit_two_journals = expect_ok(
            "GET",
            f"/api/v1/standards/{unit_two_standard['id']}/journals",
            expected_status=200,
            token=subdivision_employee["sessionToken"],
        )
        write_json("subdivision-equipment-list-include-archived", subdivision_equipment_archived)
        write_json("subdivision-measuring-instruments-list-include-archived", subdivision_measuring_instruments_archived)
        write_json("subdivision-standards-list-include-archived", subdivision_standards_archived)
        write_json("subdivision-mi-secondary-journals", subdivision_mi_secondary_journals)
        write_json("subdivision-standard-unit-two-journals", subdivision_standard_unit_two_journals)

        unit_equipment = list_registry(unit_employee["sessionToken"], "/api/v1/equipment")
        unit_equipment_archived = list_registry(unit_employee["sessionToken"], "/api/v1/equipment", include_archived=True)
        unit_measuring_instruments = list_registry(unit_employee["sessionToken"], "/api/v1/measuring-instruments")
        unit_measuring_instruments_archived = list_registry(
            unit_employee["sessionToken"],
            "/api/v1/measuring-instruments",
            include_archived=True,
        )
        unit_standards = list_registry(unit_employee["sessionToken"], "/api/v1/standards")
        unit_standards_archived = list_registry(unit_employee["sessionToken"], "/api/v1/standards", include_archived=True)
        unit_mi_primary_journals = expect_ok(
            "GET",
            f"/api/v1/measuring-instruments/{mi_primary['id']}/journals",
            expected_status=200,
            token=unit_employee["sessionToken"],
        )
        unit_mi_archive_journals = expect_ok(
            "GET",
            f"/api/v1/measuring-instruments/{mi_archive['id']}/journals",
            expected_status=200,
            token=unit_employee["sessionToken"],
        )
        unit_standard_archive_journals = expect_ok(
            "GET",
            f"/api/v1/standards/{archived_standard['id']}/journals",
            expected_status=200,
            token=unit_employee["sessionToken"],
        )
        unit_forbidden_equipment = expect_error(
            "GET",
            f"/api/v1/equipment/{equipment_secondary['id']}",
            expected_status=403,
            token=unit_employee["sessionToken"],
        )
        unit_forbidden_mi = expect_error(
            "GET",
            f"/api/v1/measuring-instruments/{mi_secondary['id']}/journals",
            expected_status=403,
            token=unit_employee["sessionToken"],
        )
        unit_forbidden_standard = expect_error(
            "GET",
            f"/api/v1/standards/{unit_two_standard['id']}/journals",
            expected_status=403,
            token=unit_employee["sessionToken"],
        )
        write_json("unit-equipment-list", unit_equipment)
        write_json("unit-equipment-list-include-archived", unit_equipment_archived)
        write_json("unit-measuring-instruments-list", unit_measuring_instruments)
        write_json("unit-measuring-instruments-list-include-archived", unit_measuring_instruments_archived)
        write_json("unit-standards-list", unit_standards)
        write_json("unit-standards-list-include-archived", unit_standards_archived)
        write_json("unit-mi-primary-journals", unit_mi_primary_journals)
        write_json("unit-mi-archive-journals", unit_mi_archive_journals)
        write_json("unit-standard-archive-journals", unit_standard_archive_journals)
        write_json("unit-forbidden-equipment", unit_forbidden_equipment)
        write_json("unit-forbidden-mi-journals", unit_forbidden_mi)
        write_json("unit-forbidden-standard-journals", unit_forbidden_standard)

        archived_row_equipment = assert_archived_row("registry_equipment", equipment_archive["id"])
        archived_row_mi = assert_archived_row("registry_measuring_instruments", mi_archive["id"])
        archived_row_standard = assert_archived_row("registry_standards", archived_standard["id"])
        journal_counts = {
            "miPrimary": journal_count("measuring_instrument", mi_primary["id"]),
            "miSecondary": journal_count("measuring_instrument", mi_secondary["id"]),
            "miArchive": journal_count("measuring_instrument", mi_archive["id"]),
            "unitOneStandard": journal_count("standard", unit_one_standard["id"]),
            "unitTwoStandard": journal_count("standard", unit_two_standard["id"]),
            "archivedStandard": journal_count("standard", archived_standard["id"]),
        }
        write_json("archived-row-equipment", archived_row_equipment)
        write_json("archived-row-mi", archived_row_mi)
        write_json("archived-row-standard", archived_row_standard)
        write_json("journal-counts", journal_counts)

        admin_equipment_items = admin_equipment["data"]
        admin_equipment_archived_items = admin_equipment_archived["data"]
        admin_mi_items = admin_measuring_instruments["data"]
        admin_mi_archived_items = admin_measuring_instruments_archived["data"]
        admin_standard_items = admin_standards["data"]
        admin_standard_archived_items = admin_standards_archived["data"]
        subdivision_standard_ids = {item["id"] for item in subdivision_standards_archived["data"]}
        unit_equipment_names = names(unit_equipment["data"], "fullName")
        unit_equipment_archived_names = names(unit_equipment_archived["data"], "fullName")
        unit_mi_names = names(unit_measuring_instruments["data"], "name")
        unit_mi_archived_names = names(unit_measuring_instruments_archived["data"], "name")
        unit_standard_ids = {item["id"] for item in unit_standards["data"]}
        unit_standard_archived_ids = {item["id"] for item in unit_standards_archived["data"]}

        equipment_counts = {item["id"]: item["measuringInstrumentCount"] for item in admin_equipment_items}
        standards_link_counts = {
            item["id"]: item["linkedMeasuringInstruments"] for item in admin_standard_items
        }
        mi_by_id = {item["id"]: item for item in admin_mi_archived_items}
        standard_by_id = {item["id"]: item for item in admin_standard_archived_items}

        mi_primary_view = mi_primary_state["data"]
        mi_archive_view = mi_archive_state["data"]
        unit_one_standard_view = unit_one_standard_state["data"]
        archived_standard_view = archived_standard_state["data"]

        checks = {
            "adminEquipmentCount": len(admin_equipment_items),
            "adminEquipmentArchivedCount": len(admin_equipment_archived_items),
            "adminMeasuringInstrumentCount": len(admin_mi_items),
            "adminMeasuringInstrumentArchivedCount": len(admin_mi_archived_items),
            "adminStandardCount": len(admin_standard_items),
            "adminStandardArchivedCount": len(admin_standard_archived_items),
            "equipmentWithoutMI": equipment_counts[equipment_zero["id"]] == 0,
            "equipmentWithMI": equipment_counts[equipment_primary["id"]] == 1 and equipment_counts[equipment_secondary["id"]] == 1,
            "sharedStandardReusable": standards_link_counts[shared_standard["id"]] == 2,
            "miPrimaryDerivedStatusActive": mi_primary_view["status"] == "active",
            "miPrimaryLatestJournalControlsStatus": mi_primary_view["latestJournal"]["documentNumber"] == mi_primary_latest["documentNumber"],
            "miPrimaryNextDueFromLatestJournal": mi_primary_view["nextDueDate"] == "2026-12-31",
            "miArchiveDerivedInactive": mi_archive_view["status"] == "inactive",
            "miArchiveLatestSuspensionWins": mi_archive_view["latestJournal"]["documentNumber"] == mi_archive_latest["documentNumber"],
            "standardRetiredFromLatestJournal": unit_one_standard_view["status"] == "retired",
            "standardRetiredLatestJournalControlsStatus": unit_one_standard_view["latestJournal"]["documentNumber"] == unit_one_standard_latest["documentNumber"],
            "archivedStandardDerivedDueDate": archived_standard_view["status"] == "active"
            and archived_standard_view["nextDueDate"] == "2026-10-31",
            "archiveHiddenFromActiveEquipmentList": equipment_archive["id"] not in {item["id"] for item in admin_equipment_items},
            "archiveVisibleInEquipmentListWhenRequested": find_by_id(admin_equipment_archived_items, equipment_archive["id"])["archivedAt"] is not None,
            "archiveHiddenFromActiveMIList": mi_archive["id"] not in {item["id"] for item in admin_mi_items},
            "archiveVisibleInMIListWhenRequested": find_by_id(admin_mi_archived_items, mi_archive["id"])["archivedAt"] is not None,
            "archiveHiddenFromActiveStandardList": archived_standard["id"] not in {item["id"] for item in admin_standard_items},
            "archiveVisibleInStandardListWhenRequested": find_by_id(admin_standard_archived_items, archived_standard["id"])["archivedAt"] is not None,
            "archiveBlocksMIJournalMutation": archived_mi_mutation_error.get("error") == "archived measuring instruments cannot be changed",
            "archiveBlocksStandardJournalMutation": archived_standard_mutation_error.get("error") == "archived standards cannot be changed",
            "subdivisionUserSeesBothUnitsAndArchive": {
                equipment_primary["fullName"],
                equipment_secondary["fullName"],
                equipment_archive["fullName"],
            }.issubset(set(names(subdivision_equipment_archived["data"], "fullName"))),
            "subdivisionUserNoOrgStandardLeak": shared_standard["id"] not in subdivision_standard_ids,
            "subdivisionUserSeesUnitTwoJournal": len(subdivision_mi_secondary_journals["data"]) == 1
            and subdivision_mi_secondary_journals["data"][0]["documentNumber"] == mi_secondary_journal["documentNumber"],
            "subdivisionUserSeesUnitTwoStandardJournal": len(subdivision_standard_unit_two_journals["data"]) == 1
            and subdivision_standard_unit_two_journals["data"][0]["documentNumber"] == unit_two_standard_journal["documentNumber"],
            "unitUserVisibleEquipment": unit_equipment_names,
            "unitUserVisibleEquipmentWithArchive": unit_equipment_archived_names,
            "unitUserVisibleMI": unit_mi_names,
            "unitUserVisibleMIWithArchive": unit_mi_archived_names,
            "unitUserNoEquipmentLeak": equipment_secondary["fullName"] not in unit_equipment_archived_names,
            "unitUserNoMILLeak": mi_secondary["name"] not in unit_mi_archived_names,
            "unitUserNoBroaderStandardLeak": shared_standard["id"] not in unit_standard_archived_ids
            and subdivision_standard["id"] not in unit_standard_archived_ids
            and unit_two_standard["id"] not in unit_standard_archived_ids,
            "unitUserKeepsOwnStandard": unit_one_standard["id"] in unit_standard_ids,
            "unitUserKeepsArchivedOwnStandard": archived_standard["id"] in unit_standard_archived_ids,
            "unitUserSeesOwnJournal": len(unit_mi_primary_journals["data"]) == 2,
            "unitUserSeesArchivedJournal": len(unit_mi_archive_journals["data"]) == 2
            and len(unit_standard_archive_journals["data"]) == 1,
            "unitForbiddenEquipment": unit_forbidden_equipment.get("error") == "forbidden",
            "unitForbiddenMIJournal": unit_forbidden_mi.get("error") == "forbidden",
            "unitForbiddenStandardJournal": unit_forbidden_standard.get("error") == "forbidden",
            "journalCountsPersisted": journal_counts == {
                "miPrimary": 2,
                "miSecondary": 1,
                "miArchive": 2,
                "unitOneStandard": 2,
                "unitTwoStandard": 1,
                "archivedStandard": 1,
            },
            "contractsBaselineReachable": len(admin_agreements["data"]) == 0,
            "archiveRowsPersist": all(
                entry["archivedCount"] == "1"
                for entry in (archived_row_equipment, archived_row_mi, archived_row_standard)
            ),
        }

        assert len(admin_equipment_items) == 3, admin_equipment
        assert len(admin_equipment_archived_items) == 4, admin_equipment_archived
        assert len(admin_mi_items) == 2, admin_measuring_instruments
        assert len(admin_mi_archived_items) == 3, admin_measuring_instruments_archived
        assert len(admin_standard_items) == 4, admin_standards
        assert len(admin_standard_archived_items) == 5, admin_standards_archived
        assert checks["equipmentWithoutMI"], admin_equipment
        assert checks["equipmentWithMI"], admin_equipment
        assert checks["sharedStandardReusable"], admin_standards
        assert checks["miPrimaryDerivedStatusActive"], mi_primary_state
        assert checks["miPrimaryLatestJournalControlsStatus"], mi_primary_state
        assert checks["miPrimaryNextDueFromLatestJournal"], mi_primary_state
        assert checks["miArchiveDerivedInactive"], mi_archive_state
        assert checks["miArchiveLatestSuspensionWins"], mi_archive_state
        assert checks["standardRetiredFromLatestJournal"], unit_one_standard_state
        assert checks["standardRetiredLatestJournalControlsStatus"], unit_one_standard_state
        assert checks["archivedStandardDerivedDueDate"], archived_standard_state
        assert checks["archiveHiddenFromActiveEquipmentList"], admin_equipment
        assert checks["archiveVisibleInEquipmentListWhenRequested"], admin_equipment_archived
        assert checks["archiveHiddenFromActiveMIList"], admin_measuring_instruments
        assert checks["archiveVisibleInMIListWhenRequested"], admin_measuring_instruments_archived
        assert checks["archiveHiddenFromActiveStandardList"], admin_standards
        assert checks["archiveVisibleInStandardListWhenRequested"], admin_standards_archived
        assert checks["archiveBlocksMIJournalMutation"], archived_mi_mutation_error
        assert checks["archiveBlocksStandardJournalMutation"], archived_standard_mutation_error
        assert checks["subdivisionUserSeesBothUnitsAndArchive"], subdivision_equipment_archived
        assert checks["subdivisionUserNoOrgStandardLeak"], subdivision_standards_archived
        assert checks["subdivisionUserSeesUnitTwoJournal"], subdivision_mi_secondary_journals
        assert checks["subdivisionUserSeesUnitTwoStandardJournal"], subdivision_standard_unit_two_journals
        assert checks["unitUserNoEquipmentLeak"], unit_equipment_archived
        assert checks["unitUserNoMILLeak"], unit_measuring_instruments_archived
        assert checks["unitUserNoBroaderStandardLeak"], unit_standards_archived
        assert checks["unitUserKeepsOwnStandard"], unit_standards
        assert checks["unitUserKeepsArchivedOwnStandard"], unit_standards_archived
        assert checks["unitUserSeesOwnJournal"], unit_mi_primary_journals
        assert checks["unitUserSeesArchivedJournal"], {
            "mi": unit_mi_archive_journals,
            "standard": unit_standard_archive_journals,
        }
        assert checks["unitForbiddenEquipment"], unit_forbidden_equipment
        assert checks["unitForbiddenMIJournal"], unit_forbidden_mi
        assert checks["unitForbiddenStandardJournal"], unit_forbidden_standard
        assert checks["journalCountsPersisted"], journal_counts
        assert checks["contractsBaselineReachable"], admin_agreements
        assert checks["archiveRowsPersist"], {
            "equipment": archived_row_equipment,
            "mi": archived_row_mi,
            "standard": archived_row_standard,
        }

        summary = {
            "seed": SEED,
            "organizationId": customer.organization_id,
            "subdivisionId": customer.subdivision_id,
            "unitOneId": customer.unit_id,
            "unitTwoId": second_unit["id"],
            "equipmentIds": {
                "zeroMI": equipment_zero["id"],
                "primary": equipment_primary["id"],
                "secondary": equipment_secondary["id"],
                "archived": equipment_archive["id"],
            },
            "measuringInstrumentIds": {
                "primary": mi_primary["id"],
                "secondary": mi_secondary["id"],
                "archived": mi_archive["id"],
            },
            "standardIds": {
                "shared": shared_standard["id"],
                "subdivision": subdivision_standard["id"],
                "unitOne": unit_one_standard["id"],
                "unitTwo": unit_two_standard["id"],
                "archived": archived_standard["id"],
            },
            "checks": checks,
        }
        write_json("proof-summary", summary)
        log_lines.append("slice-005 metrology journals and archive proof: PASS")
        log_lines.append(json.dumps(summary, ensure_ascii=False))
        write_log("proof", "\n".join(log_lines) + "\n")
        print(json.dumps(summary, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001
        log_lines.append(f"slice-005 metrology journals and archive proof: FAIL: {error}")
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
