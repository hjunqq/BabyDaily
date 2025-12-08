import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Family, FamilyMember])],
    controllers: [FamilyController],
    providers: [FamilyService],
    exports: [FamilyService],
})
export class FamilyModule { }
