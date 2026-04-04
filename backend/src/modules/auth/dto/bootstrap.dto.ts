import { IsString, IsIn, IsOptional, Length, ValidateIf } from 'class-validator';

export class BootstrapDto {
  @IsString()
  @IsIn(['dev', 'wechat'])
  method: 'dev' | 'wechat';

  @ValidateIf((o) => o.method === 'wechat')
  @IsString()
  @Length(1, 200)
  code?: string;
}
