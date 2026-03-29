-- migrations/000003_equipment_materials.down.sql
BEGIN;

DROP TABLE IF EXISTS measuring_instruments_standards CASCADE;
DROP TABLE IF EXISTS measuring_instruments CASCADE;
DROP TABLE IF EXISTS standards CASCADE;
DROP TABLE IF EXISTS metrological_types CASCADE;
DROP TABLE IF EXISTS application_equipment CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS equipment_dictionaries CASCADE;
DROP TABLE IF EXISTS equipment_status CASCADE;
DROP TABLE IF EXISTS usage_classifications CASCADE;

COMMIT;