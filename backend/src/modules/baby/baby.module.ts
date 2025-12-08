import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BabyService } from './baby.service';
import { BabyController } from './baby.controller';
import { Baby } from './entities/baby.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Baby])],
    controllers: [BabyController],
    providers: [BabyService],
    exports: [BabyService],
})
export class BabyModule { }
