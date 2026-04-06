import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { OotdService } from './ootd.service';
import { CreateOotdDto } from './dto/create-ootd.dto';
import { FamilyGuard } from '../../common/guards/family.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyRole } from '../family/entities/family-member.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ErrorCodes } from '../../common/enums/error-codes.enum';

@Controller('ootd')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class OotdController {
  constructor(private readonly ootdService: OotdService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.MEMBER)
  create(@Request() req: any, @Body() createOotdDto: CreateOotdDto) {
    return this.ootdService.create(req.user.userId, {
      ...createOotdDto,
      date: new Date(createOotdDto.date),
    });
  }

  @Post('upload')
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.MEMBER)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: diskStorage({
        destination: './uploads/ootd',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(
            new BadRequestException({
              message: 'Only image files are allowed',
              code: ErrorCodes.UPLOAD_INVALID_TYPE,
            }),
            false,
          );
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  upload(
    @Request() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('baby_id') babyId: string,
    @Body('tags') tags: string,
    @Body('date') date: string,
  ) {
    if (!files || !files.length) {
      throw new BadRequestException({
        message: 'No files uploaded',
        code: ErrorCodes.UPLOAD_INVALID_TYPE,
      });
    }
    const urls = files.map((f) => `/uploads/ootd/${f.filename}`);
    const first = urls[0];
    return this.ootdService.create(req.user.userId, {
      baby_id: babyId,
      image_url: first,
      thumbnail_url: first,
      tags: tags ? tags.split(',').filter(Boolean) : [],
      date: date ? new Date(date) : new Date(),
    });
  }

  @Get('baby/:babyId')
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.VIEWER)
  findAllByBaby(
    @Param('babyId') babyId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('tags') tags: string,
  ) {
    const tagList = tags ? tags.split(',').filter(Boolean) : undefined;
    return this.ootdService.findAllByBaby(
      babyId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      tagList,
    );
  }

  @Get('calendar/:babyId/:year/:month')
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.VIEWER)
  findByMonth(
    @Param('babyId') babyId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.ootdService.findByMonth(
      babyId,
      parseInt(year),
      parseInt(month),
    );
  }

  // Routes without babyId in params - validate ownership in service layer
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.ootdService.findOneWithOwnerCheck(id, req.user.userId);
  }

  @Post(':id/like')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  like(@Param('id') id: string) {
    return this.ootdService.like(id);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.ootdService.removeWithOwnerCheck(id, req.user.userId);
  }
}
