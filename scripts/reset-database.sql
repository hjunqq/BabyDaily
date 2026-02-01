-- BabyDaily Database Reset Script
-- This script truncates all tables while preserving the table structure
-- WARNING: This will delete ALL data in the database!

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables
TRUNCATE TABLE "record" CASCADE;
TRUNCATE TABLE "baby" CASCADE;
TRUNCATE TABLE "family_member" CASCADE;
TRUNCATE TABLE "family" CASCADE;
TRUNCATE TABLE "notification" CASCADE;
TRUNCATE TABLE "ootd" CASCADE;
TRUNCATE TABLE "user_settings" CASCADE;
TRUNCATE TABLE "user" CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify tables are empty
SELECT 'record' as table_name, COUNT(*) as row_count FROM "record"
UNION ALL
SELECT 'baby', COUNT(*) FROM "baby"
UNION ALL
SELECT 'family_member', COUNT(*) FROM "family_member"
UNION ALL
SELECT 'family', COUNT(*) FROM "family"
UNION ALL
SELECT 'notification', COUNT(*) FROM "notification"
UNION ALL
SELECT 'ootd', COUNT(*) FROM "ootd"
UNION ALL
SELECT 'user_settings', COUNT(*) FROM "user_settings"
UNION ALL
SELECT 'user', COUNT(*) FROM "user";
