import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  exportFormat?: string;

  @IsOptional()
  @IsNumber()
  dayStartHour?: number;
}
