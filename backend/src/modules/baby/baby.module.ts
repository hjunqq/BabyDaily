import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BabyService } from './baby.service';
import { BabyController } from './baby.controller';
import { Baby } from './entities/baby.entity';
import { FamilyModule } from '../family/family.module';
import { FamilyGuard } from '../../common/guards/family.guard';
import { RoleGuard } from '../../common/guards/role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Baby]), FamilyModule],
  controllers: [BabyController],
  providers: [BabyService, FamilyGuard, RoleGuard],
  exports: [BabyService],
})
export class BabyModule {}
