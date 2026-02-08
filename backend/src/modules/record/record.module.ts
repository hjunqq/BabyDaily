import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordService } from './record.service';
import { RecordController } from './record.controller';
import { RecordRepository } from './record.repository';
import { Record } from './entities/record.entity';
import { FamilyModule } from '../family/family.module';
import { FamilyGuard } from '../../common/guards/family.guard';

import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Record]), FamilyModule, SettingsModule],
  controllers: [RecordController],
  providers: [RecordService, RecordRepository, FamilyGuard],
  exports: [RecordService],
})
export class RecordModule {}
