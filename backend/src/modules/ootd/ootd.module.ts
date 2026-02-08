import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OotdService } from './ootd.service';
import { OotdController } from './ootd.controller';
import { Ootd } from './entities/ootd.entity';
import { FamilyModule } from '../family/family.module';
import { FamilyGuard } from '../../common/guards/family.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Ootd]), FamilyModule],
  controllers: [OotdController],
  providers: [OotdService, FamilyGuard],
  exports: [OotdService],
})
export class OotdModule {}
