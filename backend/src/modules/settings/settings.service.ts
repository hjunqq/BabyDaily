import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './entities/user-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(UserSettings)
        private readonly settingsRepository: Repository<UserSettings>,
    ) { }

    async getOrCreate(userId: string) {
        let settings = await this.settingsRepository.findOne({ where: { user_id: userId } });
        if (!settings) {
            settings = this.settingsRepository.create({ user_id: userId });
            settings = await this.settingsRepository.save(settings);
        }
        return settings;
    }

    async update(userId: string, dto: UpdateSettingsDto) {
        const existing = await this.getOrCreate(userId);
        await this.settingsRepository.update(existing.id, { ...dto });
        return this.getOrCreate(userId);
    }
}
