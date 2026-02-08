import { IsString, Length } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @Length(1, 50)
  name: string;
}
