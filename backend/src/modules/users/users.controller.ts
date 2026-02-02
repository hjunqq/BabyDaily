import { Controller, Get, UseGuards, Request, Patch, Body } from '@nestjs/common';
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

    // GET /users/:id removed for security - users should only access their own data via /users/me
}
