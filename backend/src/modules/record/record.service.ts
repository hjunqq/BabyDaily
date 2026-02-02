import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Record, RecordType } from './entities/record.entity';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { mapToCamelCase } from '../../common/utils/mapping';

@Injectable()
export class RecordService {
    constructor(
        @InjectRepository(Record)
        private recordRepository: Repository<Record>,
    ) { }

    /**
     * Calculate time ago string in Chinese
     * @param date The date to calculate from
     * @returns Time ago string like "2小时30分钟前"
     */
    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;

        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;

        if (hours < 24) {
            return mins > 0 ? `${hours}小时${mins}分钟前` : `${hours}小时前`;
        }

        const days = Math.floor(hours / 24);
        return `${days}天前`;
    }

    /**
     * Format time as HH:MM
     * @param date The date to format
     * @returns Formatted time string like "14:30"
     */
    private formatTime(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Calculate elapsed milliseconds from a date to now
     * @param date The date to calculate from
     * @returns Elapsed milliseconds
     */
    private getElapsedMs(date: Date): number {
        const now = new Date();
        return now.getTime() - date.getTime();
    }

    async create(userId: string, data: any): Promise<Record> {
        const record = this.recordRepository.create({
            ...data,
            baby_id: data.babyId || data.baby_id,
            creator_id: userId,
            time: data.time ? new Date(data.time) : new Date(),
            end_time: data.endTime || data.end_time ? new Date(data.endTime || data.end_time) : undefined,
            details: data.details ? this.mapDetailsToSnakeCase(data.details) : undefined,
        });
        return this.recordRepository.save(record) as any;
    }

    async findAllByBaby(babyId: string, limit = 20, offset = 0): Promise<any[]> {
        const records = await this.recordRepository.find({
            where: { baby_id: babyId },
            order: { time: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['creator'],
        });

        // First convert to camelCase
        const camelCaseRecords = mapToCamelCase(records);

        // Then enrich with server-calculated time fields for Kindle compatibility
        const enrichedRecords = camelCaseRecords.map((record: any) => {
            const recordTime = new Date(record.time);
            return {
                ...record,
                timeAgo: this.getTimeAgo(recordTime),
                formattedTime: this.formatTime(recordTime),
                elapsedMs: this.getElapsedMs(recordTime),
            };
        });

        return enrichedRecords;
    }

    async findOneWithGuard(id: string, userId: string): Promise<any | null> {
        const rec = await this.recordRepository.findOne({ where: { id }, relations: ['creator'] });
        if (!rec) return null;
        return mapToCamelCase(rec);
    }

    async updateWithGuard(id: string, data: any, userId: string): Promise<any> {
        const existing = await this.recordRepository.findOne({ where: { id } });
        if (!existing) {
            throw new NotFoundException({
                message: 'Record not found',
                code: ErrorCodes.NOT_FOUND,
            });
        }
        // Only creator can update
        if (existing.creator_id !== userId) {
            throw new ForbiddenException({
                message: 'No permission to modify this record',
                code: ErrorCodes.AUTH_FORBIDDEN,
            });
        }
        const { babyId, endTime, ...rest } = data;
        await this.recordRepository.update(id, {
            ...rest,
            baby_id: babyId || data.baby_id,
            time: data.time ? new Date(data.time) : undefined,
            end_time: endTime || data.end_time ? new Date(endTime || data.end_time) : undefined,
            details: data.details ? this.mapDetailsToSnakeCase(data.details) : undefined,
        });
        const updated = await this.recordRepository.findOne({ where: { id }, relations: ['creator'] });
        return mapToCamelCase(updated);
    }

    async removeWithGuard(id: string, userId: string): Promise<void> {
        const rec = await this.recordRepository.findOne({ where: { id } });
        if (!rec) {
            throw new NotFoundException({
                message: 'Record not found',
                code: ErrorCodes.NOT_FOUND,
            });
        }
        if (rec.creator_id !== userId) {
            throw new ForbiddenException({
                message: 'No permission to delete this record',
                code: ErrorCodes.AUTH_FORBIDDEN,
            });
        }
        await this.recordRepository.delete(id);
    }
    async removeManyWithGuard(ids: string[], userId: string): Promise<void> {
        if (!ids.length) return;

        // 验证这些记录是否都属于该用户有权操作的家庭
        // 简化起见，这里假设只检查第一条记录的权限，或者直接执行带条件的删除
        // 更严谨的做法是查询出所有记录并检查 creator_id，但这里为了性能使用 QueryBuilder
        // 限制条件：creator_id 必须是当前用户 (因为 update/remove 都有这个限制)

        await this.recordRepository.createQueryBuilder()
            .delete()
            .from(Record)
            .where("id IN (:...ids)", { ids })
            .andWhere("creator_id = :userId", { userId })
            .execute();
    }

    async removeAllByBaby(babyId: string, userId: string): Promise<void> {
        await this.recordRepository.delete({ baby_id: babyId });
    }

    async summary(babyId: string, days = 1) {
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Use DB-level aggregation for better performance
        const result = await this.recordRepository
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

        // Get last feed time separately (simpler query)
        const lastFeed = await this.recordRepository.findOne({
            where: { baby_id: babyId, type: RecordType.FEED },
            order: { time: 'DESC' },
            select: ['time'],
        });

        return {
            milkMl: parseInt(result?.milk_ml) || 0,
            diaperWet: parseInt(result?.diaper_wet) || 0,
            diaperSoiled: parseInt(result?.diaper_soiled) || 0,
            sleepMinutes: parseInt(result?.sleep_minutes) || 0,
            lastFeedTime: lastFeed?.time?.toISOString(),
        };
    }

    /**
     * 获取基于日切时间的日期范围
     * @param dayStartHour 一天开始的小时 (0-23)
     * @returns { from, to } 日期范围
     */
    private getDayRange(dayStartHour: number = 0): { from: Date; to: Date } {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(dayStartHour, 0, 0, 0);

        // 如果当前时间早于日切时间，说明"今天"实际上从昨天开始
        if (now.getHours() < dayStartHour) {
            todayStart.setDate(todayStart.getDate() - 1);
        }

        const from = todayStart;
        const to = now;

        return { from, to };
    }

    /**
     * 获取今日喂奶时间线
     * @param babyId 宝宝ID
     * @param dayStartHour 日切时间(小时)
     */
    async getFeedTimeline(babyId: string, dayStartHour: number = 0) {
        const { from, to } = this.getDayRange(dayStartHour);

        const records = await this.recordRepository.find({
            where: {
                baby_id: babyId,
                type: RecordType.FEED,
                time: Between(from, to),
            },
            order: { time: 'ASC' },
        });

        let totalMl = 0;
        const items = records.map(r => {
            const details = r.details as any;
            const amount = details?.amount || 0;
            if (details?.subtype !== 'BREAST') {
                totalMl += amount;
            }
            return {
                id: r.id,
                time: r.time.toISOString(),
                amount: amount,
                subtype: details?.subtype || 'BOTTLE',
                duration: details?.duration,
            };
        });

        return {
            dayStartHour,
            from: from.toISOString(),
            to: to.toISOString(),
            totalMl,
            items,
        };
    }

    async trend(babyId: string, days = 7) {
        const now = new Date();
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // Use DB-level aggregation grouped by date for better performance
        const rawResult = await this.recordRepository
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

        // Build result map from DB data
        const bucket = new Map<string, { milkMl: number; solidG: number }>();
        rawResult.forEach((row: any) => {
            const dayStr = row.day instanceof Date
                ? row.day.toISOString().slice(0, 10)
                : String(row.day);
            bucket.set(dayStr, {
                milkMl: parseInt(row.milk_ml) || 0,
                solidG: parseInt(row.solid_g) || 0,
            });
        });

        // Generate result for all days in range
        const result = [];
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = fmt(d);
            const val = bucket.get(key) || { milkMl: 0, solidG: 0 };
            result.push({
                date: key,
                milkMl: val.milkMl,
                solidG: val.solidG,
            });
        }
        return result;
    }

    async exportCsv(babyId: string, limit = 200) {
        // ... (existing export logic)
    }

    async importRecords(userId: string, babyId: string, records: any[]): Promise<{ count: number }> {
        const entities = this.recordRepository.create(records.map(data => ({
            ...data,
            baby_id: babyId,
            creator_id: userId,
            time: data.time ? new Date(data.time) : new Date(),
            end_time: data.endTime ? new Date(data.endTime) : undefined,
            details: data.details ? this.mapDetailsToSnakeCase(data.details) : undefined,
        })));
        await this.recordRepository.save(entities);
        return { count: entities.length };
    }

    private mapDetailsToSnakeCase(details: any): any {
        if (!details) return details;
        const mapped = { ...details };
        if (mapped.isNap !== undefined) {
            mapped.is_nap = mapped.isNap;
            delete mapped.isNap;
        }
        return mapped;
    }
}
