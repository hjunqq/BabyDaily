-- Migration: Family roles hardening
-- Run this BEFORE deploying the new backend code
-- TypeORM synchronize=true will handle new tables/columns,
-- but we need to migrate existing enum values first.

-- Step 1: Add new enum values to family_members.role
-- PostgreSQL requires adding new values to the enum type
ALTER TYPE family_members_role_enum ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE family_members_role_enum ADD VALUE IF NOT EXISTS 'GUARDIAN';
-- MEMBER and VIEWER already exist

-- Step 2: Migrate existing ADMIN → OWNER
UPDATE family_members SET role = 'OWNER' WHERE role = 'ADMIN';

-- Step 3: Add status column with default ACTIVE (for existing members)
-- TypeORM synchronize will create this, but if running manually:
-- ALTER TABLE family_members ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'ACTIVE';

-- Step 4: Verify
SELECT role, COUNT(*) FROM family_members GROUP BY role;
SELECT status, COUNT(*) FROM family_members GROUP BY status;

-- Note: The family_invites table will be auto-created by TypeORM synchronize=true
-- Note: After deploying, the old 'ADMIN' enum value will be unused but harmless
