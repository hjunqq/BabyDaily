import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordService } from './record.service';
import { RecordController } from './record.controller';
import { Record } from './entities/record.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Record])],
    controllers: [RecordController],
    providers: [RecordService],
    exports: [RecordService],
})
export class RecordModule { }
