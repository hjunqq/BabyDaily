import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './entities/user-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { mapToCamelCase } from '../../common/utils/mapping';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(UserSettings)
        private readonly settingsRepository: Repository<UserSettings>,
    ) { }

    async getOrCreate(userId: string): Promise<any> {
        let settings = await this.settingsRepository.findOne({ where: { userId: userId } });
        if (!settings) {
            settings = this.settingsRepository.create({ userId: userId });
            settings = await this.settingsRepository.save(settings);
        }
        return mapToCamelCase(settings);
    }

    async update(userId: string, dto: UpdateSettingsDto): Promise<any> {
        const existing = await this.settingsRepository.findOne({ where: { userId: userId } });
        const id = existing ? existing.id : (await this.getOrCreate(userId)).id;
        await this.settingsRepository.update(id, { ...dto });
        return this.getOrCreate(userId);
    }
}
