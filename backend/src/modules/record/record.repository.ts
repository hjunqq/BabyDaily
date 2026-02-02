import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Record, RecordType } from './entities/record.entity';

/**
 * Record Repository - Data access layer
 * Handles all database queries for records
 */
@Injectable()
export class RecordRepository {
    constructor(
        @InjectRepository(Record)
        private readonly repo: Repository<Record>,
    ) { }

    async findByBabyId(babyId: string, limit: number, offset: number): Promise<Record[]> {
        return this.repo.find({
            where: { baby_id: babyId },
            order: { time: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['creator'],
        });
    }

    async findById(id: string): Promise<Record | null> {
        return this.repo.findOne({ where: { id }, relations: ['creator'] });
    }

    async findByIdSimple(id: string): Promise<Record | null> {
        return this.repo.findOne({ where: { id } });
    }

    async create(data: Partial<Record>): Promise<Record> {
        const record = this.repo.create(data);
        return this.repo.save(record);
    }

    async update(id: string, data: Partial<Record>): Promise<void> {
        await this.repo.update(id, data);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }

    async deleteByBabyId(babyId: string): Promise<void> {
        await this.repo.delete({ baby_id: babyId });
    }

    async deleteManyByCreator(ids: string[], userId: string): Promise<void> {
        await this.repo.createQueryBuilder()
            .delete()
            .from(Record)
            .where("id IN (:...ids)", { ids })
            .andWhere("creator_id = :userId", { userId })
            .execute();
    }

    async save(entity: Record): Promise<Record> {
        return this.repo.save(entity);
    }

    async saveMany(entities: Record[]): Promise<Record[]> {
        return this.repo.save(entities);
    }

    /**
     * Aggregate summary data using SQL for performance
     */
    async aggregateSummary(babyId: string, from: Date): Promise<{
        milk_ml: string;
        diaper_wet: string;
        diaper_soiled: string;
        sleep_minutes: string;
    } | null> {
        const result = await this.repo
            .createQueryBuilder('r')
            .select([
                `SUM(CASE WHEN r.type = 'FEED' AND (r.details->>'subtype' IS NULL OR r.details->>'subtype' != 'SOLID') 
                    THEN COALESCE((r.details->>'amount')::int, 0) ELSE 0 END) as milk_ml`,
                `SUM(CASE WHEN r.type = 'DIAPER' AND r.details->>'type' IN ('PEE','BOTH') 
                    THEN 1 ELSE 0 END) as diaper_wet`,
                `SUM(CASE WHEN r.type = 'DIAPER' AND r.details->>'type' IN ('POO','BOTH') 
                    THEN 1 ELSE 0 END) as diaper_soiled`,
                `SUM(CASE WHEN r.type = 'SLEEP' 
                    THEN EXTRACT(EPOCH FROM (COALESCE(r.end_time, r.time + interval '90 minutes') - r.time))/60 
                    ELSE 0 END)::int as sleep_minutes`,
            ])
            .where('r.baby_id = :babyId', { babyId })
            .andWhere('r.time >= :from', { from })
            .getRawOne();
        return result ?? null;
    }

    async findLastFeed(babyId: string): Promise<Record | null> {
        return this.repo.findOne({
            where: { baby_id: babyId, type: RecordType.FEED },
            order: { time: 'DESC' },
            select: ['time'],
        });
    }

    /**
     * Aggregate trend data grouped by date
     */
    async aggregateTrend(babyId: string, from: Date): Promise<any[]> {
        return this.repo
            .createQueryBuilder('r')
            .select([
                `DATE(r.time) as day`,
                `SUM(CASE WHEN r.type = 'FEED' AND (r.details->>'subtype' IS NULL OR r.details->>'subtype' != 'SOLID') 
                    THEN COALESCE((r.details->>'amount')::int, 0) ELSE 0 END) as milk_ml`,
                `SUM(CASE WHEN r.type = 'FEED' AND r.details->>'subtype' = 'SOLID' 
                    THEN COALESCE((r.details->>'amount')::int, 0) ELSE 0 END) as solid_g`,
            ])
            .where('r.baby_id = :babyId', { babyId })
            .andWhere('r.time >= :from', { from })
            .andWhere('r.type = :type', { type: RecordType.FEED })
            .groupBy('DATE(r.time)')
            .orderBy('day', 'ASC')
            .getRawMany();
    }

    async findFeedsByTimeRange(babyId: string, from: Date, to: Date): Promise<Record[]> {
        return this.repo.find({
            where: {
                baby_id: babyId,
                type: RecordType.FEED,
                time: Between(from, to),
            },
            order: { time: 'ASC' },
        });
    }
}
