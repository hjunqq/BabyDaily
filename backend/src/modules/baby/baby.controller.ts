import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BabyService } from './baby.service';

@Controller('babies')
@UseGuards(AuthGuard('jwt'))
export class BabyController {
    constructor(private readonly babyService: BabyService) { }

    @Post()
    create(@Body() body: any) {
        // 简化处理，直接透传数据
        return this.babyService.create(body);
    }

    @Get('family/:familyId')
    findByFamily(@Param('familyId') familyId: string) {
        return this.babyService.findByFamily(familyId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.babyService.findOne(id);
    }
}
