-- Initialize database with schema
-- This script runs automatically when PostgreSQL container starts for the first time

-- The actual schema is managed by Alembic migrations
-- This file can be used for initial setup or custom initialization

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
