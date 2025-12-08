import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BabyService } from './baby.service';
import { CreateBabyDto } from './dto/create-baby.dto';

@Controller('babies')
@UseGuards(AuthGuard('jwt'))
export class BabyController {
    constructor(private readonly babyService: BabyService) { }

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
}
