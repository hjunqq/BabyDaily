import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecordService } from './record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { FamilyGuard } from '../../common/guards/family.guard';
import { RecordQueryDto, SummaryQueryDto } from './dto/query-record.dto';

@Controller('records')
@UseGuards(AuthGuard('jwt'), FamilyGuard)
export class RecordController {
    constructor(private readonly recordService: RecordService) { }

    @Post()
    create(@Request() req: any, @Body() createRecordDto: CreateRecordDto) {
        return this.recordService.create(req.user.userId, {
            ...createRecordDto,
            time: new Date(createRecordDto.time),
            end_time: createRecordDto.end_time ? new Date(createRecordDto.end_time) : undefined,
        });
    }

    // 具体路径要放在通配路径之前
    @Get('baby/:babyId/summary')
    summary(@Param('babyId') babyId: string, @Query() query: SummaryQueryDto) {
        return this.recordService.summary(babyId, query.days ?? 1);
    }

    @Get('baby/:babyId/trend')
    trend(@Param('babyId') babyId: string, @Query() query: SummaryQueryDto) {
        return this.recordService.trend(babyId, query.days ?? 7);
    }

    @Get('baby/:babyId')
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
    update(@Param('id') id: string, @Body() updateRecordDto: UpdateRecordDto, @Request() req: any) {
        return this.recordService.updateWithGuard(id, {
            ...updateRecordDto,
            time: updateRecordDto.time ? new Date(updateRecordDto.time) : undefined,
            end_time: updateRecordDto.end_time ? new Date(updateRecordDto.end_time) : undefined,
        }, req.user.userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.recordService.removeWithGuard(id, req.user.userId);
    }
}
