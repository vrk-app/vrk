#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import psycopg
from psycopg.types.json import Jsonb


DEV_SEED_KEY = "vrk-local-dev-seed"
DEV_SEED_VERSION = "2026-04-29.1"
ADMIN_PASSWORD = "vrk-dev-admin-secret"

ADMIN_EMAIL = f"admin+{DEV_SEED_VERSION.replace('.', '-')}@vrk.local"
ADMIN_NAME = "Анна Волкова"

ORGANIZATION_PROFILE = {
    "type": "ООО",
    "propertyType": "ООО",
    "name": 'ООО "ВРК Демо"',
    "shortName": "ВРК Демо",
    "inn": "7700000000",
    "kpp": "770001001",
    "registeredAddress": "125009, г. Москва, ул. Тверская, д. 7",
    "leaderFullName": "Волкова Анна Сергеевна",
    "leaderPosition": "Генеральный директор",
    "contractPhone": "+7 (495) 000-10-10",
    "contractEmail": ADMIN_EMAIL,
    "actingBasis": "Устава",
}

DIVISIONS = [
    {
        "key": "north",
        "name": "Северный филиал",
        "code": "VRK-NORTH",
        "region": "Санкт-Петербург",
        "address": "196084, г. Санкт-Петербург, Московский пр., д. 97",
        "leaderFullName": "Кузнецов Игорь Павлович",
        "leaderPosition": "Руководитель филиала",
        "contractPhone": "+7 (812) 000-20-10",
        "contractEmail": "north.branch@vrk.local",
        "actingBasis": "Положения о филиале",
        "contacts": "Приемная: +7 (812) 000-20-11",
        "comment": "Демо-филиал для северного региона",
    },
    {
        "key": "ural",
        "name": "Уральский филиал",
        "code": "VRK-URAL",
        "region": "Екатеринбург",
        "address": "620014, г. Екатеринбург, ул. Малышева, д. 51",
        "leaderFullName": "Смирнова Мария Андреевна",
        "leaderPosition": "Руководитель филиала",
        "contractPhone": "+7 (343) 000-30-10",
        "contractEmail": "ural.branch@vrk.local",
        "actingBasis": "Положения о филиале",
        "contacts": "Приемная: +7 (343) 000-30-11",
        "comment": "Демо-филиал для уральского региона",
    },
    {
        "key": "south",
        "name": "Южный филиал",
        "code": "VRK-SOUTH",
        "region": "Ростов-на-Дону",
        "address": "344002, г. Ростов-на-Дону, ул. Большая Садовая, д. 45",
        "leaderFullName": "Орлов Дмитрий Николаевич",
        "leaderPosition": "Руководитель филиала",
        "contractPhone": "+7 (863) 000-40-10",
        "contractEmail": "south.branch@vrk.local",
        "actingBasis": "Положения о филиале",
        "contacts": "Приемная: +7 (863) 000-40-11",
        "comment": "Демо-филиал для южного региона",
    },
]

UNITS = [
    {
        "divisionKey": "north",
        "name": "Северный ВРД-1",
        "code": "VRK-NORTH-VRD-1",
        "type": "ВРД",
        "region": "Санкт-Петербург",
        "address": "г. Санкт-Петербург, Московский пр., д. 97, корпус 1",
        "leaderFullName": "Беляев Алексей Ильич",
    },
    {
        "divisionKey": "north",
        "name": "Северный ВРЗ-2",
        "code": "VRK-NORTH-VRZ-2",
        "type": "ВРЗ",
        "region": "Санкт-Петербург",
        "address": "г. Санкт-Петербург, Московский пр., д. 97, корпус 2",
        "leaderFullName": "Соколова Елена Романовна",
    },
    {
        "divisionKey": "north",
        "name": "Северный ВУ-3",
        "code": "VRK-NORTH-VU-3",
        "type": "ВУ",
        "region": "Ленинградская область",
        "address": "Ленинградская обл., г. Колпино, Индустриальная ул., д. 5",
        "leaderFullName": "Громов Павел Сергеевич",
    },
    {
        "divisionKey": "ural",
        "name": "Уральский ВРД-1",
        "code": "VRK-URAL-VRD-1",
        "type": "ВРД",
        "region": "Свердловская область",
        "address": "г. Екатеринбург, ул. Малышева, д. 51, корпус 1",
        "leaderFullName": "Захаров Роман Викторович",
    },
    {
        "divisionKey": "ural",
        "name": "Уральский ВРП-2",
        "code": "VRK-URAL-VRP-2",
        "type": "ВРП",
        "region": "Свердловская область",
        "address": "г. Екатеринбург, ул. Малышева, д. 51, корпус 2",
        "leaderFullName": "Никитина Ольга Юрьевна",
    },
    {
        "divisionKey": "ural",
        "name": "Уральский ВУ-3",
        "code": "VRK-URAL-VU-3",
        "type": "ВУ",
        "region": "Пермский край",
        "address": "г. Пермь, ул. Ленина, д. 18",
        "leaderFullName": "Морозов Андрей Степанович",
    },
    {
        "divisionKey": "south",
        "name": "Южный ВРД-1",
        "code": "VRK-SOUTH-VRD-1",
        "type": "ВРД",
        "region": "Ростовская область",
        "address": "г. Ростов-на-Дону, ул. Большая Садовая, д. 45, корпус 1",
        "leaderFullName": "Федорова Ирина Михайловна",
    },
    {
        "divisionKey": "south",
        "name": "Южный ВРЗ-2",
        "code": "VRK-SOUTH-VRZ-2",
        "type": "ВРЗ",
        "region": "Краснодарский край",
        "address": "г. Краснодар, ул. Северная, д. 120",
        "leaderFullName": "Поляков Денис Артемович",
    },
    {
        "divisionKey": "south",
        "name": "Южный ВРП-3",
        "code": "VRK-SOUTH-VRP-3",
        "type": "ВРП",
        "region": "Ростовская область",
        "address": "г. Ростов-на-Дону, ул. Большая Садовая, д. 45, корпус 3",
        "leaderFullName": "Лебедева Наталья Олеговна",
    },
]


class DevSeedError(RuntimeError):
    pass


def env(name: str, default: str) -> str:
    return os.getenv(name, default)


API_BASE_URL = env("DEV_SEED_API_BASE_URL", "http://localhost:18080/api/v1").rstrip("/")
WEB_URL = env("DEV_SEED_WEB_URL", "http://localhost:3100")
OUTPUT_PATH = Path(env("DEV_SEED_OUTPUT_PATH", ".local/dev-seed.json"))
DISPLAY_OUTPUT_PATH = env("DEV_SEED_DISPLAY_OUTPUT_PATH", ".local/dev-seed.json")
PLATFORM_ADMIN_SECRET = env("PLATFORM_ADMIN_SHARED_SECRET", "stage03-platform-admin-secret")


def request_json(
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    platform_admin: bool = False,
    expected_status: int = 200,
) -> dict[str, Any]:
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    if token is not None:
        headers["Authorization"] = f"Bearer {token}"
    if platform_admin:
        headers["X-VRK-Platform-Admin-Secret"] = PLATFORM_ADMIN_SECRET

    request = urllib.request.Request(f"{API_BASE_URL}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response_body = response.read().decode("utf-8")
            status = response.getcode()
    except urllib.error.HTTPError as error:
        response_body = error.read().decode("utf-8", errors="replace")
        raise DevSeedError(f"{method} {path} failed with HTTP {error.code}: {response_body}") from error
    except urllib.error.URLError as error:
        raise DevSeedError(f"{method} {path} failed: {error}") from error

    if status != expected_status:
        raise DevSeedError(f"{method} {path} returned HTTP {status}, expected {expected_status}: {response_body}")

    try:
        payload = json.loads(response_body)
    except json.JSONDecodeError as error:
        raise DevSeedError(f"{method} {path} returned invalid JSON: {response_body[:300]}") from error

    if payload.get("success") is not True or "data" not in payload:
        raise DevSeedError(f"{method} {path} returned unsuccessful envelope: {payload}")
    return payload["data"]


def connect_db() -> psycopg.Connection:
    return psycopg.connect(
        host=env("DB_HOST", "localhost"),
        port=int(env("DB_PORT", "5432")),
        dbname=env("DB_NAME", "db"),
        user=env("DB_USER", "postgres"),
        password=env("DB_PASSWORD", "postgres"),
    )


def advisory_lock_key(value: str) -> int:
    digest = hashlib.sha256(value.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], byteorder="big", signed=True)


def read_seed_run(conn: psycopg.Connection) -> tuple[str, dict[str, Any]] | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT status, result_json
            FROM dev_seed_runs
            WHERE seed_key = %s AND version = %s
            """,
            (DEV_SEED_KEY, DEV_SEED_VERSION),
        )
        row = cur.fetchone()
    if row is None:
        return None
    status, result_json = row
    if isinstance(result_json, str):
        result_json = json.loads(result_json)
    return status, result_json


def mark_running(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO dev_seed_runs (seed_key, version, status, started_at, result_json)
            VALUES (%s, %s, 'running', NOW(), '{}'::jsonb)
            """,
            (DEV_SEED_KEY, DEV_SEED_VERSION),
        )
    conn.commit()


def mark_success(conn: psycopg.Connection, result: dict[str, Any]) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE dev_seed_runs
            SET status = 'success',
                finished_at = NOW(),
                result_json = %s
            WHERE seed_key = %s AND version = %s
            """,
            (Jsonb(result), DEV_SEED_KEY, DEV_SEED_VERSION),
        )
    conn.commit()


def mark_failed(conn: psycopg.Connection, error: Exception) -> None:
    result = {
        "seedKey": DEV_SEED_KEY,
        "version": DEV_SEED_VERSION,
        "error": str(error),
    }
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE dev_seed_runs
            SET status = 'failed',
                finished_at = NOW(),
                result_json = %s
            WHERE seed_key = %s AND version = %s
            """,
            (Jsonb(result), DEV_SEED_KEY, DEV_SEED_VERSION),
        )
    conn.commit()


def find_by_code(items: list[dict[str, Any]], code: str, item_name: str) -> dict[str, Any]:
    for item in items:
        if item.get("code") == code:
            return item
    raise DevSeedError(f"created {item_name} with code {code!r} was not returned by the API")


def division_payload(division: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": division["name"],
        "code": division["code"],
        "region": division["region"],
        "address": division["address"],
        "leaderFullName": division["leaderFullName"],
        "leaderPosition": division["leaderPosition"],
        "contractPhone": division["contractPhone"],
        "contractEmail": division["contractEmail"],
        "actingBasis": division["actingBasis"],
        "contacts": division["contacts"],
        "comment": division["comment"],
    }


def unit_payload(unit: dict[str, Any], division_id: str) -> dict[str, Any]:
    return {
        "type": unit["type"],
        "name": unit["name"],
        "code": unit["code"],
        "region": unit["region"],
        "divisionId": division_id,
        "address": unit["address"],
        "leaderFullName": unit["leaderFullName"],
        "leaderPosition": "Руководитель юнита",
        "contractPhone": "+7 (900) 000-50-10",
        "contractEmail": f"{unit['code'].lower()}@vrk.local",
        "actingBasis": "Положения о юните",
        "contacts": "Диспетчерская: +7 (900) 000-50-11",
        "comment": "Демо-юнит локального seed",
    }


def public_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
    local = json.loads(json.dumps(metadata, ensure_ascii=False))
    local["admin"]["password"] = ADMIN_PASSWORD
    return local


def write_local_result(metadata: dict[str, Any]) -> None:
    local_result = public_metadata(metadata)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    temp_path = OUTPUT_PATH.with_suffix(OUTPUT_PATH.suffix + ".tmp")
    flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC
    fd = os.open(temp_path, flags, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as file:
        json.dump(local_result, file, ensure_ascii=False, indent=2)
        file.write("\n")
    os.replace(temp_path, OUTPUT_PATH)
    os.chmod(OUTPUT_PATH, 0o600)


def print_summary(metadata: dict[str, Any], *, already_applied: bool) -> None:
    status = "seed already applied" if already_applied else "seed applied"
    print("")
    print("VRK dev seed")
    print(f"status: {status}")
    print(f"seed: {DEV_SEED_KEY} {DEV_SEED_VERSION}")
    print(f"url: {metadata['webUrl']}")
    print(f"email: {metadata['admin']['email']}")
    print(f"password: {ADMIN_PASSWORD}")
    print(f"organizationId: {metadata['organization']['id']}")
    print(f"credentialsFile: {DISPLAY_OUTPUT_PATH}")
    print("")
    print("divisions:")
    for division in metadata["divisions"]:
        print(f"  - {division['name']} ({division['code']}): {division['id']}")
    print("units:")
    for unit in metadata["units"]:
        print(f"  - {unit['name']} ({unit['code']}, {unit['type']}): {unit['id']}")
    print("")


def create_seed_data() -> dict[str, Any]:
    shell = request_json(
        "POST",
        "/platform/organization-shells",
        platform_admin=True,
        expected_status=201,
        body={
            "organizationName": ORGANIZATION_PROFILE["name"],
            "organizationRole": "customer",
            "firstAdminName": ADMIN_NAME,
            "firstAdminEmail": ADMIN_EMAIL,
        },
    )

    request_json("GET", f"/first-admin-invites/{shell['inviteToken']}")

    accepted = request_json(
        "POST",
        f"/first-admin-invites/{shell['inviteToken']}/accept",
        body={"password": ADMIN_PASSWORD},
    )
    session_token = accepted["sessionToken"]
    if accepted.get("requiresLaunchWizard") is not False:
        raise DevSeedError("first-admin accept unexpectedly returned requiresLaunchWizard=true")
    if accepted.get("organization", {}).get("launchState") != "active":
        raise DevSeedError("first-admin accept did not activate the organization")

    profile = request_json(
        "PATCH",
        "/company/profile",
        token=session_token,
        body=ORGANIZATION_PROFILE,
    )

    division_by_key: dict[str, dict[str, Any]] = {}
    for division in DIVISIONS:
        response = request_json(
            "POST",
            "/company/divisions",
            token=session_token,
            expected_status=201,
            body=division_payload(division),
        )
        created = find_by_code(response["divisions"], division["code"], "division")
        division_by_key[division["key"]] = created

    created_units: list[dict[str, Any]] = []
    for unit in UNITS:
        division_id = division_by_key[unit["divisionKey"]]["id"]
        response = request_json(
            "POST",
            "/company/units",
            token=session_token,
            expected_status=201,
            body=unit_payload(unit, division_id),
        )
        created_units.append(find_by_code(response["units"], unit["code"], "unit"))

    login = request_json(
        "POST",
        "/sessions",
        body={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    if login.get("workspace", {}).get("scopeType") != "organization":
        raise DevSeedError("seed admin login did not resolve to organization workspace")
    if len(login.get("divisions", [])) != 3 or len(login.get("units", [])) != 9:
        raise DevSeedError("seed admin login did not return the expected 3 divisions and 9 units")

    organization = profile["organization"]
    return {
        "seedKey": DEV_SEED_KEY,
        "version": DEV_SEED_VERSION,
        "webUrl": WEB_URL,
        "admin": {
            "email": ADMIN_EMAIL,
            "name": ADMIN_NAME,
        },
        "organization": {
            "id": organization["id"],
            "name": organization["name"],
        },
        "divisions": [
            {
                "id": division_by_key[division["key"]]["id"],
                "name": division_by_key[division["key"]]["name"],
                "code": division_by_key[division["key"]].get("code"),
                "region": division_by_key[division["key"]].get("region"),
            }
            for division in DIVISIONS
        ],
        "units": [
            {
                "id": unit["id"],
                "name": unit["name"],
                "code": unit.get("code"),
                "type": unit.get("type"),
                "divisionId": unit.get("divisionId"),
            }
            for unit in created_units
        ],
    }


def run() -> int:
    with connect_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT pg_advisory_lock(%s)", (advisory_lock_key(DEV_SEED_KEY),))

        existing = read_seed_run(conn)
        if existing is not None:
            status, result = existing
            if status == "success":
                write_local_result(result)
                print_summary(result, already_applied=True)
                return 0
            if status == "failed":
                raise DevSeedError(
                    f"dev seed {DEV_SEED_KEY} {DEV_SEED_VERSION} is marked failed; "
                    "run make clean or bump DEV_SEED_VERSION before retrying"
                )
            raise DevSeedError(
                f"dev seed {DEV_SEED_KEY} {DEV_SEED_VERSION} is marked {status}; "
                "run make clean if the previous run was interrupted"
            )

        mark_running(conn)
        try:
            metadata = create_seed_data()
        except Exception as error:
            mark_failed(conn, error)
            raise

        mark_success(conn, metadata)
        write_local_result(metadata)
        print_summary(metadata, already_applied=False)
        return 0


if __name__ == "__main__":
    try:
        raise SystemExit(run())
    except DevSeedError as error:
        print(f"dev seed failed: {error}", file=sys.stderr)
        raise SystemExit(1)
