import { IsString, IsIn, IsOptional, Length, ValidateIf } from 'class-validator';

export class BootstrapDto {
  @IsString()
  @IsIn(['dev', 'wechat', 'pin', 'admin'])
  method: 'dev' | 'wechat' | 'pin' | 'admin';

  @ValidateIf((o) => o.method === 'wechat')
  @IsString()
  @Length(1, 200)
  code?: string;

  @ValidateIf((o) => o.method === 'pin')
  @IsString()
  @Length(1, 200)
  pin?: string;

  @ValidateIf((o) => o.method === 'admin')
  @IsString()
  @Length(1, 100)
  username?: string;

  @ValidateIf((o) => o.method === 'admin')
  @IsString()
  @Length(1, 200)
  password?: string;
}
