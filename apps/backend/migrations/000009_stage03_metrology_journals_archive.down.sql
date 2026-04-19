BEGIN;

DROP TABLE IF EXISTS registry_metrology_journal_entries;

ALTER TABLE registry_standards
    DROP COLUMN IF EXISTS archived_at;

ALTER TABLE registry_measuring_instruments
    DROP COLUMN IF EXISTS archived_at;

ALTER TABLE registry_equipment
    DROP COLUMN IF EXISTS archived_at;

COMMIT;
