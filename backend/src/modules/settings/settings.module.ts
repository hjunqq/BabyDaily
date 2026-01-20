import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { UserSettings } from './entities/user-settings.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserSettings])],
    providers: [SettingsService],
    controllers: [SettingsController],
})
export class SettingsModule { }
