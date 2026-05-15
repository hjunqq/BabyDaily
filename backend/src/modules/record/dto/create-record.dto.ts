import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsDateString,
  IsNumber,
  IsIn,
  IsUUID,
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
  TOPICAL = 'TOPICAL',
  SOLIDS = 'SOLIDS',
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

export class TopicalDetailsDto {
  @IsString()
  product: string; // e.g. 桃子水 / 护臀膏

  @IsString()
  @IsOptional()
  area?: string; // 涂抹部位，可选
}

export class SolidsDetailsDto {
  @IsString()
  food: string; // 辅食名称，如 米粉 / 蛋黄

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class CreateRecordDto {
  @IsUUID()
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
