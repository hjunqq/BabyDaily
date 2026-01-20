import { Controller, Get, Param, UseGuards, Request, Patch, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    getMe(@Request() req: any) {
        return this.usersService.findOne(req.user.userId);
    }

    @Patch('me')
    updateMe(@Request() req: any, @Body() body: Partial<{ nickname: string; avatar_url: string }>) {
        return this.usersService.update(req.user.userId, body);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }
}
