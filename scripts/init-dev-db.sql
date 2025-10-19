-- Development Database Initialization Script
-- This script is executed when the development PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create development databases
CREATE DATABASE ai_qualifier_dev_test;

-- Create development user
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'dev_user') THEN
      
      CREATE ROLE dev_user WITH LOGIN PASSWORD 'dev_password';
   END IF;
END
$do$;

-- Grant full permissions for development
GRANT ALL PRIVILEGES ON DATABASE ai_qualifier_dev TO dev_user;
GRANT ALL PRIVILEGES ON DATABASE ai_qualifier_dev_test TO dev_user;

-- Enable development-friendly settings
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 0;

-- Reload configuration
SELECT pg_reload_conf();