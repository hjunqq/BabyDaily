import { Controller, Get, Post, Param, Query, UseGuards, Request, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@Request() req: any, @Query('limit') limit: string, @Query('offset') offset: string) {
        return this.notificationsService.findAllByUser(
            req.user.userId,
            limit ? parseInt(limit, 10) : 20,
            offset ? parseInt(offset, 10) : 0,
        );
    }

    @Post()
    create(@Request() req: any, @Body() dto: CreateNotificationDto) {
        return this.notificationsService.create(req.user.userId, dto);
    }

    @Post(':id/read')
    markRead(@Request() req: any, @Param('id') id: string) {
        return this.notificationsService.markRead(req.user.userId, id);
    }
}
