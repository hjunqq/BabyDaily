import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `families.day_start_hour` (nullable int) — introduced in commit 9873713
 * ("家庭多账号 + 设置按家庭聚合"). Production had been kept in sync by
 * `synchronize: true`; this migration replays the same ALTER so any fresh
 * environment (CI, new dev DB, restored backup) ends up with the same schema.
 */
export class AddDayStartHourToFamilies1778979000000 implements MigrationInterface {
    name = 'AddDayStartHourToFamilies1778979000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "families" ADD COLUMN IF NOT EXISTS "day_start_hour" integer`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "families" DROP COLUMN IF EXISTS "day_start_hour"`,
        );
    }
}
