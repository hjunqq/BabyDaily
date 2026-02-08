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
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { FamilyGuard } from '../../common/guards/family.guard';
import { RecordQueryDto, SummaryQueryDto } from './dto/query-record.dto';
import type { Response } from 'express';

@Controller('records')
@UseGuards(AuthGuard('jwt'))
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @UseGuards(FamilyGuard)
  create(@Request() req: any, @Body() createRecordDto: CreateRecordDto) {
    return this.recordService.create(req.user.userId, {
      ...createRecordDto,
      time: new Date(createRecordDto.time),
      endTime: createRecordDto.endTime
        ? new Date(createRecordDto.endTime)
        : undefined,
    });
  }

  // 具体路径要放在通配路径之前
  @Get('baby/:babyId/summary')
  @UseGuards(FamilyGuard)
  summary(@Param('babyId') babyId: string, @Request() req: any) {
    return this.recordService.summary(babyId, req.user.userId);
  }

  @Get('baby/:babyId/trend')
  @UseGuards(FamilyGuard)
  trend(
    @Param('babyId') babyId: string,
    @Query() query: SummaryQueryDto,
    @Request() req: any,
  ) {
    return this.recordService.trend(babyId, query.days ?? 7, req.user.userId);
  }

  @Get('baby/:babyId/feed-timeline')
  @UseGuards(FamilyGuard)
  getFeedTimeline(
    @Param('babyId') babyId: string,
    @Query('dayStartHour') dayStartHour?: string,
  ) {
    const hour = dayStartHour ? parseInt(dayStartHour, 10) : 0;
    return this.recordService.getFeedTimeline(babyId, hour);
  }

  @Get('baby/:babyId/export')
  @UseGuards(FamilyGuard)
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
  @UseGuards(FamilyGuard)
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
  removeMany(@Body() body: { ids: string[] }, @Request() req: any) {
    return this.recordService.removeManyWithGuard(body.ids, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.recordService.removeWithGuard(id, req.user.userId);
  }

  @Delete('baby/:babyId/all')
  @UseGuards(FamilyGuard)
  removeAll(@Param('babyId') babyId: string, @Request() req: any) {
    return this.recordService.removeAllByBaby(babyId, req.user.userId);
  }
}
