-- migrations/000001_init_schema_users.down.sql
BEGIN;

DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organization_units CASCADE;
DROP TABLE IF EXISTS organization_roles CASCADE;
DROP TABLE IF EXISTS property_types CASCADE;
DROP TABLE IF EXISTS permission_levels CASCADE;
DROP TABLE IF EXISTS permission_types CASCADE;

COMMIT;