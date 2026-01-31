import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { mapToCamelCase } from '../../common/utils/mapping';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }

    async findAllByUser(userId: string, limit = 20, offset = 0): Promise<any[]> {
        const items = await this.notificationRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
        });
        return mapToCamelCase(items);
    }

    async create(userId: string, dto: CreateNotificationDto): Promise<any> {
        const entity = this.notificationRepository.create({
            user_id: userId,
            title: dto.title,
            content: dto.content,
            type: dto.type,
        });
        const saved = await this.notificationRepository.save(entity);
        return mapToCamelCase(saved);
    }

    async markRead(userId: string, id: string): Promise<any> {
        await this.notificationRepository.update({ id, user_id: userId }, { is_read: true });
        const updated = await this.notificationRepository.findOne({ where: { id, user_id: userId } });
        return mapToCamelCase(updated);
    }
}
