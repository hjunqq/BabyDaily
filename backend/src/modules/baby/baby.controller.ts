import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BabyService } from './baby.service';
import { CreateBabyDto } from './dto/create-baby.dto';
import { FamilyGuard } from '../../common/guards/family.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyRole } from '../family/entities/family-member.entity';

@Controller('babies')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class BabyController {
  constructor(private readonly babyService: BabyService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @RequireRole(FamilyRole.GUARDIAN)
  create(@Body() body: CreateBabyDto) {
    return this.babyService.create({
      ...body,
      birthday: new Date(body.birthday),
    });
  }

  @Get('family/:familyId')
  @RequireRole(FamilyRole.VIEWER)
  findByFamily(@Param('familyId') familyId: string) {
    return this.babyService.findByFamily(familyId);
  }

  @Get(':id')
  @UseGuards(FamilyGuard)
  findOne(@Param('id') id: string) {
    return this.babyService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.GUARDIAN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.babyService.update(id, {
      ...body,
      birthday: body.birthday ? new Date(body.birthday) : undefined,
    });
  }

  @Post(':id/avatar')
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.GUARDIAN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/avatars';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.babyService.update(id, { avatar_url: avatarUrl });
  }
}
