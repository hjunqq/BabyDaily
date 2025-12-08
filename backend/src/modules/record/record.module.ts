import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordService } from './record.service';
import { RecordController } from './record.controller';
import { Record } from './entities/record.entity';
import { FamilyModule } from '../family/family.module';
import { FamilyGuard } from '../../common/guards/family.guard';

@Module({
    imports: [TypeOrmModule.forFeature([Record]), FamilyModule],
    controllers: [RecordController],
    providers: [RecordService, FamilyGuard],
    exports: [RecordService],
})
export class RecordModule { }
