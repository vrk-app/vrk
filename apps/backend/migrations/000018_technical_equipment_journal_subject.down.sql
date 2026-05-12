BEGIN;

DELETE FROM registry_metrology_journal_entries
WHERE subject_type = 'technical_equipment';

ALTER TABLE registry_metrology_journal_entries
    DROP CONSTRAINT IF EXISTS registry_metrology_journal_entries_subject_type_check;

ALTER TABLE registry_metrology_journal_entries
    ADD CONSTRAINT registry_metrology_journal_entries_subject_type_check
    CHECK (subject_type IN ('measuring_instrument', 'standard'));

COMMIT;
