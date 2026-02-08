import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';

@Controller('families')
@UseGuards(AuthGuard('jwt'))
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateFamilyDto) {
    return this.familyService.create(
      req.user.userId,
      dto.name,
      req.user.openid,
    );
  }

  @Get('my')
  findMyFamilies(@Request() req: any) {
    return this.familyService.findMyFamilies(req.user.userId);
  }
}
