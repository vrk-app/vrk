#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import os
import sys
from typing import Any
from uuid import UUID

import psycopg
from psycopg.rows import dict_row


LOCK_KEY = "vrk-equipment-registry-seed"
PLANNED_COUNTS = {
    "registry_equipment": 3,
    "registry_measuring_instruments": 3,
    "registry_standards": 3,
    "registry_metrology_journal_entries": 6,
}


class EquipmentSeedError(RuntimeError):
    pass


def env(name: str, default: str) -> str:
    return os.getenv(name, default)


def connect_db() -> psycopg.Connection:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg.connect(database_url, row_factory=dict_row)

    return psycopg.connect(
        host=env("DB_HOST", "localhost"),
        port=int(env("DB_PORT", "5432")),
        dbname=env("DB_NAME", "db"),
        user=env("DB_USER", "postgres"),
        password=env("DB_PASSWORD", "postgres"),
        sslmode=env("DB_SSL_MODE", "disable"),
        row_factory=dict_row,
    )


def advisory_lock_key(value: str) -> int:
    digest = hashlib.sha256(value.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], byteorder="big", signed=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Hard-replace registry equipment demo data for one organization. "
            "If no selector is passed, the latest successful dev_seed_runs organization is used."
        )
    )
    target = parser.add_mutually_exclusive_group()
    target.add_argument("--latest-dev-seed", action="store_true", help="Use the latest successful dev seed organization.")
    target.add_argument("--organization-id", help="Target auth_bootstrap_organizations.id.")
    target.add_argument("--organization-name", help="Exact target auth_bootstrap_organizations.shell_name.")
    parser.add_argument("--dry-run", action="store_true", help="Print target, units and counts without mutating data.")
    parser.add_argument("--yes", action="store_true", help="Confirm destructive hard replace for the selected organization.")
    return parser.parse_args()


def validate_uuid(value: str, field_name: str) -> str:
    try:
        return str(UUID(value))
    except ValueError as error:
        raise EquipmentSeedError(f"{field_name} must be a valid UUID") from error


def resolve_latest_dev_seed_organization(cur: psycopg.Cursor) -> dict[str, Any]:
    cur.execute(
        """
        SELECT result_json->'organization'->>'id' AS organization_id
        FROM dev_seed_runs
        WHERE status = 'success'
          AND result_json->'organization'->>'id' IS NOT NULL
        ORDER BY finished_at DESC NULLS LAST, started_at DESC
        LIMIT 1
        """
    )
    row = cur.fetchone()
    if row is None:
        raise EquipmentSeedError("no successful dev seed organization found in dev_seed_runs")

    organization_id = validate_uuid(row["organization_id"], "latest dev seed organization id")
    organization = get_organization(cur, organization_id)
    if organization is None:
        raise EquipmentSeedError(f"latest dev seed organization {organization_id} no longer exists")
    return organization


def resolve_organization(cur: psycopg.Cursor, args: argparse.Namespace) -> dict[str, Any]:
    if args.organization_id:
        organization_id = validate_uuid(args.organization_id, "--organization-id")
        organization = get_organization(cur, organization_id)
        if organization is None:
            raise EquipmentSeedError(f"organization {organization_id} not found")
        return organization

    if args.organization_name:
        cur.execute(
            """
            SELECT id, shell_name
            FROM auth_bootstrap_organizations
            WHERE shell_name = %s
            ORDER BY created_at DESC
            """,
            (args.organization_name,),
        )
        rows = cur.fetchall()
        if not rows:
            raise EquipmentSeedError(f"organization with shell_name {args.organization_name!r} not found")
        if len(rows) > 1:
            raise EquipmentSeedError(
                f"organization name {args.organization_name!r} matched {len(rows)} organizations; use --organization-id"
            )
        return dict(rows[0])

    return resolve_latest_dev_seed_organization(cur)


def get_organization(cur: psycopg.Cursor, organization_id: str) -> dict[str, Any] | None:
    cur.execute(
        """
        SELECT id, shell_name
        FROM auth_bootstrap_organizations
        WHERE id = %s
        """,
        (organization_id,),
    )
    row = cur.fetchone()
    return dict(row) if row else None


def list_seed_units(cur: psycopg.Cursor, organization_id: str) -> list[dict[str, Any]]:
    cur.execute(
        """
        SELECT id, name, unit_type, division_id
        FROM auth_units
        WHERE organization_id = %s
          AND status = 'active'
        ORDER BY created_at ASC, id ASC
        LIMIT 3
        """,
        (organization_id,),
    )
    units = [dict(row) for row in cur.fetchall()]
    if len(units) < 3:
        raise EquipmentSeedError(
            f"organization {organization_id} must have at least 3 active units; found {len(units)}"
        )
    return units


def count_registry_rows(cur: psycopg.Cursor, organization_id: str) -> dict[str, int]:
    cur.execute(
        """
        SELECT
            (SELECT COUNT(*) FROM registry_equipment WHERE organization_id = %(organization_id)s) AS registry_equipment,
            (
                SELECT COUNT(*)
                FROM registry_measuring_instruments
                WHERE organization_id = %(organization_id)s
            ) AS registry_measuring_instruments,
            (SELECT COUNT(*) FROM registry_standards WHERE organization_id = %(organization_id)s) AS registry_standards,
            (
                SELECT COUNT(*)
                FROM registry_metrology_journal_entries
                WHERE organization_id = %(organization_id)s
            ) AS registry_metrology_journal_entries
        """,
        {"organization_id": organization_id},
    )
    row = cur.fetchone()
    if row is None:
        raise EquipmentSeedError("failed to count registry rows")
    return {key: int(row[key]) for key in PLANNED_COUNTS}


def technical_equipment_payloads(units: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "key": "boiler",
            "unit_id": units[0]["id"],
            "manufacturer": "ПромТепло",
            "classification": "Котельное оборудование",
            "model": "PT-400",
            "full_name": "Паровой котел PT-400",
            "factory_number": "PT400-7781",
            "inventory_number": "EQ-1001",
            "manufacture_year": 2022,
            "status": "active",
            "comment": "Основной агрегат участка.",
            "document_url": "https://example.local/equipment/pt-400.pdf",
        },
        {
            "key": "compressor",
            "unit_id": units[1]["id"],
            "manufacturer": "КомпрессорСервис",
            "classification": "Компрессорное оборудование",
            "model": "KS-12",
            "full_name": "Компрессорная станция KS-12",
            "factory_number": "KS12-4420",
            "inventory_number": "EQ-2040",
            "manufacture_year": 2020,
            "status": "active",
            "comment": "Питание пневмолиний ремонтной зоны.",
            "document_url": "https://example.local/equipment/ks-12.pdf",
        },
        {
            "key": "test-bench",
            "unit_id": units[2]["id"],
            "manufacturer": "ВагонМаш",
            "classification": "Испытательное оборудование",
            "model": "SO-8",
            "full_name": "Стенд обкаточный SO-8",
            "factory_number": "SO8-2033",
            "inventory_number": "EQ-3055",
            "manufacture_year": 2021,
            "status": "active",
            "comment": "Используется для приемочного контроля узлов.",
            "document_url": "https://example.local/equipment/so-8.pdf",
        },
    ]


def diagnostic_payloads(units: list[dict[str, Any]], equipment_by_key: dict[str, str]) -> list[dict[str, Any]]:
    return [
        {
            "key": "flow-meter",
            "unit_id": units[0]["id"],
            "equipment_id": equipment_by_key["boiler"],
            "name": "Расходомер линии подготовки",
            "instrument_type": "Расходомер",
            "model": "RM-80",
            "registration_number": "ФИФ-2026-019",
            "serial_number": "RM80-8120",
            "status": "active",
            "placement_kind": "built_in",
            "comment": "Встроен в контур подготовки пара.",
            "document_url": "https://example.local/diagnostics/rm-80.pdf",
        },
        {
            "key": "vibration-meter",
            "unit_id": units[1]["id"],
            "equipment_id": equipment_by_key["compressor"],
            "name": "Датчик вибрации компрессора",
            "instrument_type": "Виброметр",
            "model": "VB-21",
            "registration_number": "ФИФ-2026-024",
            "serial_number": "VB21-4418",
            "status": "active",
            "placement_kind": "built_in",
            "comment": "Контролирует вибрацию ведущего подшипника.",
            "document_url": "https://example.local/diagnostics/vb-21.pdf",
        },
        {
            "key": "pressure-gauge",
            "unit_id": units[2]["id"],
            "equipment_id": None,
            "name": "Манометр контрольный",
            "instrument_type": "Манометр",
            "model": "MK-160",
            "registration_number": "ФИФ-2026-031",
            "serial_number": "MK160-5520",
            "status": "active",
            "placement_kind": "standalone",
            "comment": "Переносное диагностическое оборудование метрологической группы.",
            "document_url": "https://example.local/diagnostics/mk-160.pdf",
        },
    ]


def standard_payloads(units: list[dict[str, Any]], diagnostic_by_key: dict[str, str]) -> list[dict[str, Any]]:
    return [
        {
            "unit_id": units[0]["id"],
            "owner_label": units[0]["name"],
            "diagnostic_equipment_id": diagnostic_by_key["flow-meter"],
            "standard_type": "Эталон расхода",
            "model": "ER-10",
            "identifier": "STD-ER-10",
            "serial_number": "ER10-552",
            "metrological_characteristics": "0-10 м3/ч, класс 0.1",
            "status": "active",
            "comment": "Рабочий эталон для встроенного расходомера.",
            "document_url": "https://example.local/standards/er-10.pdf",
        },
        {
            "unit_id": units[1]["id"],
            "owner_label": units[1]["name"],
            "diagnostic_equipment_id": diagnostic_by_key["vibration-meter"],
            "standard_type": "Эталон виброскорости",
            "model": "EV-5",
            "identifier": "STD-EV-5",
            "serial_number": "EV5-118",
            "metrological_characteristics": "0-50 мм/с, погрешность 0.5%",
            "status": "active",
            "comment": "Используется для контрольной настройки виброметра.",
            "document_url": "https://example.local/standards/ev-5.pdf",
        },
        {
            "unit_id": units[2]["id"],
            "owner_label": units[2]["name"],
            "diagnostic_equipment_id": diagnostic_by_key["pressure-gauge"],
            "standard_type": "Эталон давления",
            "model": "ED-25",
            "identifier": "STD-ED-25",
            "serial_number": "ED25-144",
            "metrological_characteristics": "0-25 МПа, класс 0.05",
            "status": "active",
            "comment": "Эталон для контрольного манометра.",
            "document_url": "https://example.local/standards/ed-25.pdf",
        },
    ]


def journal_payloads(diagnostic_by_key: dict[str, str]) -> list[dict[str, Any]]:
    return [
        {
            "subject_id": diagnostic_by_key["flow-meter"],
            "operation_type": "calibration",
            "operation_date": "2026-02-20",
            "document_number": "КЛ-2026-018",
            "valid_until": "2026-08-20",
            "executor_organization": "ТехСервис Метролоджик",
            "attachment_url": "https://example.local/journals/kl-2026-018.pdf",
            "comment": "Первичная калибровка перед вводом в эксплуатацию.",
        },
        {
            "subject_id": diagnostic_by_key["flow-meter"],
            "operation_type": "verification",
            "operation_date": "2026-04-20",
            "document_number": "СВ-2026-041",
            "valid_until": "2027-04-20",
            "executor_organization": "ТехСервис Метролоджик",
            "attachment_url": "https://example.local/journals/sv-2026-041.pdf",
            "comment": "Поверка выполнена без замечаний.",
        },
        {
            "subject_id": diagnostic_by_key["vibration-meter"],
            "operation_type": "maintenance",
            "operation_date": "2026-03-05",
            "document_number": "ТО-2026-027",
            "valid_until": None,
            "executor_organization": "ФБУ Ростест-Москва",
            "attachment_url": "https://example.local/journals/to-2026-027.pdf",
            "comment": "Плановое обслуживание датчика.",
        },
        {
            "subject_id": diagnostic_by_key["vibration-meter"],
            "operation_type": "verification",
            "operation_date": "2026-05-05",
            "document_number": "СВ-2026-052",
            "valid_until": "2027-05-05",
            "executor_organization": "ФБУ Ростест-Москва",
            "attachment_url": "https://example.local/journals/sv-2026-052.pdf",
            "comment": "Поверка подтверждает годность к эксплуатации.",
        },
        {
            "subject_id": diagnostic_by_key["pressure-gauge"],
            "operation_type": "calibration",
            "operation_date": "2026-01-18",
            "document_number": "КЛ-2026-009",
            "valid_until": "2027-01-18",
            "executor_organization": "Метрологическая лаборатория ВРК",
            "attachment_url": "https://example.local/journals/kl-2026-009.pdf",
            "comment": "Калибровка после приемки.",
        },
        {
            "subject_id": diagnostic_by_key["pressure-gauge"],
            "operation_type": "verification",
            "operation_date": "2026-04-30",
            "document_number": "СВ-2026-048",
            "valid_until": "2027-04-30",
            "executor_organization": "Метрологическая лаборатория ВРК",
            "attachment_url": "https://example.local/journals/sv-2026-048.pdf",
            "comment": "Очередная поверка, оборудование активно.",
        },
    ]


def delete_existing_registry_rows(cur: psycopg.Cursor, organization_id: str) -> None:
    cur.execute("DELETE FROM registry_metrology_journal_entries WHERE organization_id = %s", (organization_id,))
    cur.execute("DELETE FROM registry_standards WHERE organization_id = %s", (organization_id,))
    cur.execute("DELETE FROM registry_measuring_instruments WHERE organization_id = %s", (organization_id,))
    cur.execute("DELETE FROM registry_equipment WHERE organization_id = %s", (organization_id,))


def insert_equipment(cur: psycopg.Cursor, organization_id: str, units: list[dict[str, Any]]) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in technical_equipment_payloads(units):
        cur.execute(
            """
            INSERT INTO registry_equipment (
                organization_id,
                unit_id,
                manufacturer,
                classification,
                model,
                full_name,
                factory_number,
                inventory_number,
                manufacture_year,
                status,
                comment,
                document_url
            ) VALUES (
                %(organization_id)s,
                %(unit_id)s,
                %(manufacturer)s,
                %(classification)s,
                %(model)s,
                %(full_name)s,
                %(factory_number)s,
                %(inventory_number)s,
                %(manufacture_year)s,
                %(status)s,
                %(comment)s,
                %(document_url)s
            )
            RETURNING id
            """,
            {**item, "organization_id": organization_id},
        )
        row = cur.fetchone()
        if row is None:
            raise EquipmentSeedError(f"failed to insert equipment {item['full_name']!r}")
        result[item["key"]] = str(row["id"])
    return result


def insert_diagnostics(
    cur: psycopg.Cursor,
    organization_id: str,
    units: list[dict[str, Any]],
    equipment_by_key: dict[str, str],
) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in diagnostic_payloads(units, equipment_by_key):
        cur.execute(
            """
            INSERT INTO registry_measuring_instruments (
                organization_id,
                unit_id,
                equipment_id,
                name,
                instrument_type,
                model,
                registration_number,
                serial_number,
                status,
                placement_kind,
                comment,
                document_url
            ) VALUES (
                %(organization_id)s,
                %(unit_id)s,
                %(equipment_id)s,
                %(name)s,
                %(instrument_type)s,
                %(model)s,
                %(registration_number)s,
                %(serial_number)s,
                %(status)s,
                %(placement_kind)s,
                %(comment)s,
                %(document_url)s
            )
            RETURNING id
            """,
            {**item, "organization_id": organization_id},
        )
        row = cur.fetchone()
        if row is None:
            raise EquipmentSeedError(f"failed to insert diagnostic equipment {item['name']!r}")
        result[item["key"]] = str(row["id"])
    return result


def insert_standards(
    cur: psycopg.Cursor,
    organization_id: str,
    units: list[dict[str, Any]],
    diagnostic_by_key: dict[str, str],
) -> None:
    for item in standard_payloads(units, diagnostic_by_key):
        cur.execute(
            """
            INSERT INTO registry_standards (
                organization_id,
                division_id,
                unit_id,
                owner_label,
                diagnostic_equipment_id,
                standard_type,
                model,
                identifier,
                serial_number,
                metrological_characteristics,
                status,
                comment,
                document_url
            ) VALUES (
                %(organization_id)s,
                NULL,
                %(unit_id)s,
                %(owner_label)s,
                %(diagnostic_equipment_id)s,
                %(standard_type)s,
                %(model)s,
                %(identifier)s,
                %(serial_number)s,
                %(metrological_characteristics)s,
                %(status)s,
                %(comment)s,
                %(document_url)s
            )
            """,
            {**item, "organization_id": organization_id},
        )


def insert_journal_entries(cur: psycopg.Cursor, organization_id: str, diagnostic_by_key: dict[str, str]) -> None:
    for item in journal_payloads(diagnostic_by_key):
        cur.execute(
            """
            INSERT INTO registry_metrology_journal_entries (
                organization_id,
                subject_type,
                subject_id,
                operation_type,
                operation_date,
                document_number,
                valid_until,
                executor_organization,
                attachment_url,
                comment
            ) VALUES (
                %(organization_id)s,
                'measuring_instrument',
                %(subject_id)s,
                %(operation_type)s,
                %(operation_date)s::date,
                %(document_number)s,
                %(valid_until)s::date,
                %(executor_organization)s,
                %(attachment_url)s,
                %(comment)s
            )
            """,
            {**item, "organization_id": organization_id},
        )


def apply_seed(cur: psycopg.Cursor, organization_id: str, units: list[dict[str, Any]]) -> None:
    delete_existing_registry_rows(cur, organization_id)
    equipment_by_key = insert_equipment(cur, organization_id, units)
    diagnostic_by_key = insert_diagnostics(cur, organization_id, units, equipment_by_key)
    insert_standards(cur, organization_id, units, diagnostic_by_key)
    insert_journal_entries(cur, organization_id, diagnostic_by_key)


def print_summary(
    *,
    dry_run: bool,
    organization: dict[str, Any],
    units: list[dict[str, Any]],
    before_counts: dict[str, int],
    after_counts: dict[str, int] | None = None,
) -> None:
    print("")
    print("VRK equipment registry seed")
    print(f"mode: {'dry-run' if dry_run else 'applied'}")
    print(f"organization: {organization['shell_name']} ({organization['id']})")
    print("")
    print("selected units:")
    for unit in units:
        print(f"  - {unit['name']} ({unit['unit_type']}): {unit['id']}")
    print("")
    print("counts before:")
    for key, value in before_counts.items():
        print(f"  - {key}: {value}")

    if dry_run:
        print("")
        print("planned replacement:")
        for key, value in PLANNED_COUNTS.items():
            print(f"  - {key}: {value}")
        print("")
        return

    print("")
    print("counts after:")
    assert after_counts is not None
    for key, value in after_counts.items():
        print(f"  - {key}: {value}")
    print("")


def run() -> int:
    args = parse_args()
    if not args.dry_run and not args.yes:
        raise EquipmentSeedError("destructive hard replace requires --yes")

    with connect_db() as conn:
        with conn.cursor() as cur:
            if not args.dry_run:
                cur.execute("SELECT pg_advisory_xact_lock(%s)", (advisory_lock_key(LOCK_KEY),))

            organization = resolve_organization(cur, args)
            organization_id = str(organization["id"])
            units = list_seed_units(cur, organization_id)
            before_counts = count_registry_rows(cur, organization_id)

            if args.dry_run:
                print_summary(
                    dry_run=True,
                    organization=organization,
                    units=units,
                    before_counts=before_counts,
                )
                conn.rollback()
                return 0

            apply_seed(cur, organization_id, units)
            after_counts = count_registry_rows(cur, organization_id)

        conn.commit()

    print_summary(
        dry_run=False,
        organization=organization,
        units=units,
        before_counts=before_counts,
        after_counts=after_counts,
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(run())
    except EquipmentSeedError as error:
        print(f"equipment registry seed failed: {error}", file=sys.stderr)
        raise SystemExit(1)
