import { PartialType } from '@nestjs/mapped-types';
import { CreateOotdDto } from './create-ootd.dto';

export class UpdateOotdDto extends PartialType(CreateOotdDto) {}
