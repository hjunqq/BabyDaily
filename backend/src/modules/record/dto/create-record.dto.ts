import { IsString, IsEnum, IsOptional, IsObject, IsDateString, IsNumber, IsIn } from 'class-validator';

export enum RecordType {
    FEED = 'FEED',
    SLEEP = 'SLEEP',
    DIAPER = 'DIAPER',
}

export class FeedDetailsDto {
    @IsString()
    @IsOptional()
    subtype?: string; // BREAST | BOTTLE | SOLID

    @IsNumber()
    @IsOptional()
    amount?: number;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsString()
    @IsOptional()
    duration?: string;
}

export class DiaperDetailsDto {
    @IsIn(['PEE', 'POO', 'BOTH'])
    type: string;
}

export class SleepDetailsDto {
    @IsIn([true, false])
    is_nap: boolean;
}

export class CreateRecordDto {
    @IsString()
    baby_id: string;

    @IsEnum(RecordType)
    type: RecordType;

    @IsDateString()
    time: string;

    @IsOptional()
    @IsDateString()
    end_time?: string;

    @IsObject()
    @IsOptional()
    details?: object;
}
