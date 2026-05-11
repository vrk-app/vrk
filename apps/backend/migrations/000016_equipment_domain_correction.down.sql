BEGIN;

ALTER TABLE registry_standards
    DROP CONSTRAINT IF EXISTS chk_registry_standards_current_diagnostic_owner;

DROP INDEX IF EXISTS idx_registry_standards_diagnostic_equipment_id;

ALTER TABLE registry_standards
    DROP COLUMN IF EXISTS diagnostic_equipment_id;

COMMIT;
