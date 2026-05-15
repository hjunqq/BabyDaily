-- Migration: 新增 TOPICAL（涂药膏）和 SOLIDS（辅食）记录类型
-- Run this BEFORE deploying the new backend code.
-- TypeORM synchronize=true cannot add values to an existing postgres enum,
-- so we ALTER the enum manually first.

ALTER TYPE records_type_enum ADD VALUE IF NOT EXISTS 'TOPICAL';
ALTER TYPE records_type_enum ADD VALUE IF NOT EXISTS 'SOLIDS';

-- Verify
SELECT unnest(enum_range(NULL::records_type_enum)) AS record_type;
