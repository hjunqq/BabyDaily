import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OotdService } from './ootd.service';
import { OotdController } from './ootd.controller';
import { Ootd } from './entities/ootd.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ootd])],
    controllers: [OotdController],
    providers: [OotdService],
    exports: [OotdService],
})
export class OotdModule { }
