import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Patch,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { FamilyGuard } from '../../common/guards/family.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { FamilyRole } from '../family/entities/family-member.entity';
import { RecordQueryDto, SummaryQueryDto } from './dto/query-record.dto';
import type { Response } from 'express';

@Controller('records')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.MEMBER)
  create(@Request() req: any, @Body() createRecordDto: CreateRecordDto) {
    return this.recordService.create(req.user.userId, {
      ...createRecordDto,
      time: new Date(createRecordDto.time),
      endTime: createRecordDto.endTime
        ? new Date(createRecordDto.endTime)
        : undefined,
    });
  }

  @Get('baby/:babyId/summary')
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.VIEWER)
  summary(@Param('babyId') babyId: string, @Request() req: any) {
    return this.recordService.summary(babyId, req.user.userId);
  }

  @Get('baby/:babyId/kindle-summary')
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.VIEWER)
  kindleSummary(@Param('babyId') babyId: string, @Request() req: any) {
    return this.recordService.kindleSummary(babyId, req.user.userId);
  }

  @Get('baby/:babyId/trend')
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.VIEWER)
  trend(
    @Param('babyId') babyId: string,
    @Query() query: SummaryQueryDto,
    @Request() req: any,
  ) {
    return this.recordService.trend(babyId, query.days ?? 7, req.user.userId);
  }

  @Get('baby/:babyId/feed-timeline')
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.VIEWER)
  getFeedTimeline(
    @Param('babyId') babyId: string,
    @Query('dayStartHour') dayStartHour?: string,
  ) {
    const hour = dayStartHour ? parseInt(dayStartHour, 10) : 0;
    return this.recordService.getFeedTimeline(babyId, hour);
  }

  @Get('baby/:babyId/export')
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.VIEWER)
  async exportCsv(
    @Param('babyId') babyId: string,
    @Query('limit') limit: string,
    @Res() res: Response,
  ) {
    const csv = await this.recordService.exportCsv(
      babyId,
      limit ? parseInt(limit, 10) : 200,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="records-${babyId}.csv"`,
    );
    return res.send(csv);
  }

  @Post('baby/:babyId/import')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.GUARDIAN)
  importRecords(
    @Request() req: any,
    @Param('babyId') babyId: string,
    @Body() body: { records: any[] },
  ) {
    return this.recordService.importRecords(
      req.user.userId,
      babyId,
      body.records,
    );
  }

  @Get('baby/:babyId')
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.VIEWER)
  findAllByBaby(
    @Param('babyId') babyId: string,
    @Query() query: RecordQueryDto,
  ) {
    return this.recordService.findAllByBaby(
      babyId,
      query.limit ?? 20,
      query.offset ?? 0,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.recordService.findOneWithGuard(id, req.user.userId);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordDto,
    @Request() req: any,
  ) {
    return this.recordService.updateWithGuard(
      id,
      {
        ...updateRecordDto,
        time: updateRecordDto.time ? new Date(updateRecordDto.time) : undefined,
        endTime: updateRecordDto.endTime
          ? new Date(updateRecordDto.endTime)
          : undefined,
      },
      req.user.userId,
    );
  }

  @Delete('batch')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  removeMany(@Body() body: { ids: string[] }, @Request() req: any) {
    return this.recordService.removeManyWithGuard(body.ids, req.user.userId);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.recordService.removeWithGuard(id, req.user.userId);
  }

  @Delete('baby/:babyId/all')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(FamilyGuard)
  @RequireRole(FamilyRole.OWNER)
  removeAll(@Param('babyId') babyId: string, @Request() req: any) {
    return this.recordService.removeAllByBaby(babyId, req.user.userId);
  }
}
