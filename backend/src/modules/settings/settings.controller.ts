import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@Request() req: any) {
    if (!req.user?.userId) {
      throw new Error('User ID not found in request');
    }
    return this.settingsService.getOrCreate(req.user.userId);
  }

  @Put()
  updateSettings(@Request() req: any, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(req.user.userId, dto);
  }
}
