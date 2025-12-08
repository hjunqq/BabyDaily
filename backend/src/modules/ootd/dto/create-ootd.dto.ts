import { IsString, IsOptional, IsArray, IsDateString, IsUrl } from 'class-validator';

export class CreateOotdDto {
    @IsString()
    baby_id: string;

    @IsUrl()
    image_url: string;

    @IsOptional()
    @IsUrl()
    thumbnail_url?: string;

    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @IsDateString()
    date: string;
}
