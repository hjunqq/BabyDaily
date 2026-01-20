import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }

    async findAllByUser(userId: string, limit = 20, offset = 0) {
        return this.notificationRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async create(userId: string, dto: CreateNotificationDto) {
        const entity = this.notificationRepository.create({
            user_id: userId,
            title: dto.title,
            content: dto.content,
            type: dto.type,
        });
        return this.notificationRepository.save(entity);
    }

    async markRead(userId: string, id: string) {
        await this.notificationRepository.update({ id, user_id: userId }, { is_read: true });
        return this.notificationRepository.findOne({ where: { id, user_id: userId } });
    }
}
