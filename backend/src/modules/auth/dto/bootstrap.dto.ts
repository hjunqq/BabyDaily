import { IsString, IsIn, Length, ValidateIf } from 'class-validator';

export class BootstrapDto {
  @IsString()
  @IsIn(['dev', 'wechat', 'admin'])
  method: 'dev' | 'wechat' | 'admin';

  @ValidateIf((o) => o.method === 'wechat')
  @IsString()
  @Length(1, 200)
  code?: string;

  @ValidateIf((o) => o.method === 'admin')
  @IsString()
  @Length(1, 100)
  username?: string;

  @ValidateIf((o) => o.method === 'admin')
  @IsString()
  @Length(1, 200)
  password?: string;
}
