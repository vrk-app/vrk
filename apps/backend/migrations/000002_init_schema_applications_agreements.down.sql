-- migrations/000002_applications_agreements.down.sql
BEGIN;

DROP TABLE IF EXISTS materials_service_types CASCADE;
DROP TABLE IF EXISTS agreement_works_costs CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS agreements CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS service_types CASCADE;
DROP TABLE IF EXISTS application_statuses CASCADE;
DROP TABLE IF EXISTS application_types CASCADE;

COMMIT;