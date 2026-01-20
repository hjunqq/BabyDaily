import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
    @IsOptional()
    @IsString()
    theme?: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsString()
    export_format?: string;
}
