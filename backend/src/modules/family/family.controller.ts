import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FamilyService } from './family.service';

@Controller('families')
@UseGuards(AuthGuard('jwt'))
export class FamilyController {
    constructor(private readonly familyService: FamilyService) { }

    @Post()
    create(@Request() req: any, @Body('name') name: string) {
        return this.familyService.create(req.user.userId, name);
    }

    @Get('my')
    findMyFamilies(@Request() req: any) {
        return this.familyService.findMyFamilies(req.user.userId);
    }
}
