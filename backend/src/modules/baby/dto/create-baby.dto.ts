import { IsString, IsDateString, IsEnum, IsOptional, IsUUID, Length } from 'class-validator';
import { Gender } from '../entities/baby.entity';

export class CreateBabyDto {
    @IsUUID()
    family_id: string;

    @IsString()
    @Length(1, 50)
    name: string;

    @IsEnum(Gender)
    gender: Gender;

    @IsDateString()
    birthday: string;

    @IsOptional()
    @IsString()
    avatar_url?: string;
}
