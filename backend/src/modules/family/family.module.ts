import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { FamilyInvite } from './entities/family-invite.entity';
import { Baby } from '../baby/entities/baby.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Family, FamilyMember, FamilyInvite, Baby]),
    UsersModule,
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [FamilyService, TypeOrmModule],
})
export class FamilyModule {}
