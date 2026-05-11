BEGIN;

ALTER TABLE registry_standards
    ADD COLUMN diagnostic_equipment_id UUID REFERENCES registry_measuring_instruments(id) ON DELETE CASCADE;

CREATE INDEX idx_registry_standards_diagnostic_equipment_id
    ON registry_standards (diagnostic_equipment_id);

CREATE TEMP TABLE tmp_registry_standard_parent_map (
    legacy_standard_id UUID NOT NULL,
    measuring_instrument_id UUID NOT NULL,
    standard_id UUID NOT NULL,
    keep_original BOOLEAN NOT NULL,
    PRIMARY KEY (legacy_standard_id, measuring_instrument_id)
) ON COMMIT DROP;

CREATE TEMP TABLE tmp_registry_standard_copy_map (
    legacy_standard_id UUID NOT NULL,
    measuring_instrument_id UUID NOT NULL,
    standard_id UUID NOT NULL DEFAULT gen_random_uuid(),
    PRIMARY KEY (legacy_standard_id, measuring_instrument_id)
) ON COMMIT DROP;

WITH ranked_links AS (
    SELECT
        link.standard_id AS legacy_standard_id,
        link.measuring_instrument_id,
        ROW_NUMBER() OVER (
            PARTITION BY link.standard_id
            ORDER BY link.created_at, link.measuring_instrument_id
        ) AS link_rank
    FROM registry_measuring_instrument_standards link
    JOIN registry_standards standard ON standard.id = link.standard_id
    JOIN registry_measuring_instruments diagnostic ON diagnostic.id = link.measuring_instrument_id
    WHERE standard.archived_at IS NULL
      AND standard.organization_id = diagnostic.organization_id
)
INSERT INTO tmp_registry_standard_parent_map (
    legacy_standard_id,
    measuring_instrument_id,
    standard_id,
    keep_original
)
SELECT
    legacy_standard_id,
    measuring_instrument_id,
    legacy_standard_id,
    TRUE
FROM ranked_links
WHERE link_rank = 1;

WITH ranked_links AS (
    SELECT
        link.standard_id AS legacy_standard_id,
        link.measuring_instrument_id,
        ROW_NUMBER() OVER (
            PARTITION BY link.standard_id
            ORDER BY link.created_at, link.measuring_instrument_id
        ) AS link_rank
    FROM registry_measuring_instrument_standards link
    JOIN registry_standards standard ON standard.id = link.standard_id
    JOIN registry_measuring_instruments diagnostic ON diagnostic.id = link.measuring_instrument_id
    WHERE standard.archived_at IS NULL
      AND standard.organization_id = diagnostic.organization_id
)
INSERT INTO tmp_registry_standard_copy_map (
    legacy_standard_id,
    measuring_instrument_id
)
SELECT
    legacy_standard_id,
    measuring_instrument_id
FROM ranked_links
WHERE link_rank > 1;

INSERT INTO registry_standards (
    id,
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
    document_url,
    archived_at,
    created_at,
    updated_at
)
SELECT
    copy.standard_id,
    standard.organization_id,
    NULL,
    diagnostic.unit_id,
    unit.name,
    copy.measuring_instrument_id,
    standard.standard_type,
    standard.model,
    standard.identifier,
    standard.serial_number,
    standard.metrological_characteristics,
    standard.status,
    standard.comment,
    standard.document_url,
    standard.archived_at,
    standard.created_at,
    NOW()
FROM tmp_registry_standard_copy_map copy
JOIN registry_standards standard ON standard.id = copy.legacy_standard_id
JOIN registry_measuring_instruments diagnostic ON diagnostic.id = copy.measuring_instrument_id
JOIN auth_units unit ON unit.id = diagnostic.unit_id;

INSERT INTO tmp_registry_standard_parent_map (
    legacy_standard_id,
    measuring_instrument_id,
    standard_id,
    keep_original
)
SELECT
    legacy_standard_id,
    measuring_instrument_id,
    standard_id,
    FALSE
FROM tmp_registry_standard_copy_map;

UPDATE registry_standards standard
SET
    diagnostic_equipment_id = parent.measuring_instrument_id,
    division_id = NULL,
    unit_id = diagnostic.unit_id,
    owner_label = unit.name,
    updated_at = NOW()
FROM tmp_registry_standard_parent_map parent
JOIN registry_measuring_instruments diagnostic ON diagnostic.id = parent.measuring_instrument_id
JOIN auth_units unit ON unit.id = diagnostic.unit_id
WHERE standard.id = parent.standard_id;

UPDATE registry_measuring_instrument_standards link
SET standard_id = parent.standard_id
FROM tmp_registry_standard_parent_map parent
WHERE link.standard_id = parent.legacy_standard_id
  AND link.measuring_instrument_id = parent.measuring_instrument_id
  AND link.standard_id <> parent.standard_id;

UPDATE registry_standards standard
SET
    archived_at = NOW(),
    updated_at = NOW(),
    comment = CASE
        WHEN NULLIF(BTRIM(standard.comment), '') IS NULL THEN
            'Archived by migration 000016: no diagnostic equipment parent could be derived from legacy links.'
        ELSE
            standard.comment || E'\nArchived by migration 000016: no diagnostic equipment parent could be derived from legacy links.'
    END
WHERE standard.archived_at IS NULL
  AND standard.diagnostic_equipment_id IS NULL;

ALTER TABLE registry_standards
    ADD CONSTRAINT chk_registry_standards_current_diagnostic_owner
    CHECK (archived_at IS NOT NULL OR diagnostic_equipment_id IS NOT NULL);

WITH duplicate_legacy_links AS (
    SELECT standard_id
    FROM registry_measuring_instrument_standards
    GROUP BY standard_id
    HAVING COUNT(DISTINCT measuring_instrument_id) > 1
)
DELETE FROM registry_measuring_instrument_standards link
USING duplicate_legacy_links duplicate
WHERE link.standard_id = duplicate.standard_id;

COMMIT;
