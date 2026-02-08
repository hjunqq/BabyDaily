import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsDateString,
  IsNumber,
  IsIn,
} from 'class-validator';

export enum RecordType {
  FEED = 'FEED',
  SLEEP = 'SLEEP',
  DIAPER = 'DIAPER',
  BATH = 'BATH',
  HEALTH = 'HEALTH',
  GROWTH = 'GROWTH',
  MILESTONE = 'MILESTONE',
  VITA_AD = 'VITA_AD',
  VITA_D3 = 'VITA_D3',
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
  isNap: boolean;
}

export class SupplementDetailsDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class CreateRecordDto {
  @IsString()
  babyId: string;

  @IsEnum(RecordType)
  type: RecordType;

  @IsDateString()
  time: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsObject()
  @IsOptional()
  details?: object;

  @IsString()
  @IsOptional()
  remark?: string;
}
