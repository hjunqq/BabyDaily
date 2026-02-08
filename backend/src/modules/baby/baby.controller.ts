import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AuthGuard } from '@nestjs/passport';
import { BabyService } from './baby.service';
import { CreateBabyDto } from './dto/create-baby.dto';

@Controller('babies')
@UseGuards(AuthGuard('jwt'))
export class BabyController {
  constructor(private readonly babyService: BabyService) {}

  @Post()
  create(@Body() body: CreateBabyDto) {
    return this.babyService.create({
      ...body,
      birthday: new Date(body.birthday),
    });
  }

  @Get('family/:familyId')
  findByFamily(@Param('familyId') familyId: string) {
    return this.babyService.findByFamily(familyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.babyService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.babyService.update(id, {
      ...body,
      birthday: body.birthday ? new Date(body.birthday) : undefined,
    });
  }

  @Post(':id/avatar')
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
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
