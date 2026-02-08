import { IsString, Length } from 'class-validator';

export class LoginWechatDto {
  @IsString()
  @Length(1, 200)
  code: string;
}
