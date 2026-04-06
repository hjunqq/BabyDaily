import { IsString, IsIn, IsOptional, Length, ValidateIf } from 'class-validator';

export class BootstrapDto {
  @IsString()
  @IsIn(['dev', 'wechat', 'pin'])
  method: 'dev' | 'wechat' | 'pin';

  @ValidateIf((o) => o.method === 'wechat')
  @IsString()
  @Length(1, 200)
  code?: string;

  @ValidateIf((o) => o.method === 'pin')
  @IsString()
  @Length(1, 200)
  pin?: string;
}
