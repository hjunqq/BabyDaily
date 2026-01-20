import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { FamilyModule } from './modules/family/family.module';
import { BabyModule } from './modules/baby/baby.module';
import { RecordModule } from './modules/record/record.module';
import { OotdModule } from './modules/ootd/ootd.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // âš ï¸ ä»…åœ¨å¼€å‘çŽ¯å¢ƒå¼€å¯ï¼Œç”Ÿäº§çŽ¯å¢ƒè¯·å…³é—­      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    FamilyModule,
    BabyModule,
    RecordModule,
    OotdModule,
    SettingsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
