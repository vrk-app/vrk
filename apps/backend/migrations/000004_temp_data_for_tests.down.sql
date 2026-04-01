-- migrations/000004_seed_data.down.sql
BEGIN;

-- Удаление тестовых данных
DELETE FROM applications;
DELETE FROM agreements;
DELETE FROM schedules;
DELETE FROM materials;
DELETE FROM warehouses;
DELETE FROM equipment;
DELETE FROM equipment_dictionaries;
DELETE FROM measuring_instruments;
DELETE FROM standards;
DELETE FROM users;
DELETE FROM organization_units;
DELETE FROM organization_roles;
DELETE FROM property_types;
DELETE FROM user_roles;
DELETE FROM permission_levels;
DELETE FROM permission_types;
DELETE FROM application_statuses;
DELETE FROM application_types;
DELETE FROM equipment_status;
DELETE FROM usage_classifications;
DELETE FROM metrological_types;

-- Сброс последовательностей (для application_statuses)
ALTER SEQUENCE application_statuses_id_seq RESTART WITH 1;

COMMIT;