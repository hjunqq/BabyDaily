import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { UserSettings } from './entities/user-settings.entity';
import { Family } from '../family/entities/family.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Baby } from '../baby/entities/baby.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserSettings, Family, FamilyMember, Baby])],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
