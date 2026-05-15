import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserSettings } from './entities/user-settings.entity';
import { mapToCamelCase } from '../../common/utils/mapping';
import { Family } from '../family/entities/family.entity';
import {
  FamilyMember,
  MemberStatus,
} from '../family/entities/family-member.entity';
import { Baby } from '../baby/entities/baby.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>,
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private readonly familyMemberRepository: Repository<FamilyMember>,
    @InjectRepository(Baby)
    private readonly babyRepository: Repository<Baby>,
  ) {}

  async getOrCreate(userId: string, familyId?: string): Promise<any> {
    const userSettings = await this.getOrCreateUserSettings(userId);
    const resolvedFamilyId = await this.resolveFamilyId(userId, familyId);
    const dayStartHour = await this.resolveFamilyDayStartHour(
      userSettings,
      resolvedFamilyId,
    );

    return {
      ...mapToCamelCase(userSettings),
      dayStartHour,
    };
  }

  async update(
    userId: string,
    dto: UpdateSettingsDto,
    familyId?: string,
  ): Promise<any> {
    const userSettings = await this.getOrCreateUserSettings(userId);
    const resolvedFamilyId = await this.resolveFamilyId(userId, familyId);

    await this.settingsRepository.update(userSettings.id, {
      theme: dto.theme,
      language: dto.language,
      exportFormat: dto.exportFormat,
    });

    if (resolvedFamilyId && dto.dayStartHour !== undefined) {
      await this.familyRepository.update(resolvedFamilyId, {
        day_start_hour: this.normalizeDayStartHour(dto.dayStartHour),
      });
    }

    return this.getOrCreate(userId, resolvedFamilyId || undefined);
  }

  async resolveDayStartHour(
    userId?: string,
    options?: { familyId?: string; babyId?: string },
  ): Promise<number> {
    if (!userId) {
      return 0;
    }

    const userSettings = await this.getOrCreateUserSettings(userId);
    let familyId = options?.familyId;

    if (!familyId && options?.babyId) {
      const baby = await this.babyRepository.findOne({
        where: { id: options.babyId },
      });
      familyId = baby?.family_id;
    }

    return this.resolveFamilyDayStartHour(userSettings, familyId);
  }

  private async getOrCreateUserSettings(userId: string): Promise<UserSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({ userId });
      settings = await this.settingsRepository.save(settings);
    }

    return settings;
  }

  private async resolveFamilyId(
    userId: string,
    requestedFamilyId?: string,
  ): Promise<string | null> {
    if (requestedFamilyId) {
      const member = await this.familyMemberRepository.findOne({
        where: {
          family_id: requestedFamilyId,
          user_id: userId,
          status: MemberStatus.ACTIVE,
        },
      });

      if (!member) {
        throw new ForbiddenException('No access to this family');
      }

      return requestedFamilyId;
    }

    const member = await this.familyMemberRepository.findOne({
      where: {
        user_id: userId,
        status: MemberStatus.ACTIVE,
      },
      order: {
        created_at: 'ASC',
      },
    });

    return member?.family_id || null;
  }

  private async resolveFamilyDayStartHour(
    userSettings: UserSettings,
    familyId: string | null | undefined,
  ): Promise<number> {
    if (!familyId) {
      return this.normalizeDayStartHour(userSettings.dayStartHour);
    }

    const family = await this.familyRepository.findOne({
      where: { id: familyId },
    });

    if (!family) {
      return this.normalizeDayStartHour(userSettings.dayStartHour);
    }

    if (family.day_start_hour === null || family.day_start_hour === undefined) {
      const migratedHour = this.normalizeDayStartHour(userSettings.dayStartHour);
      family.day_start_hour = migratedHour;
      await this.familyRepository.save(family);
      return migratedHour;
    }

    return this.normalizeDayStartHour(family.day_start_hour);
  }

  private normalizeDayStartHour(value?: number | null): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.min(23, Math.floor(value as number)));
  }
}
