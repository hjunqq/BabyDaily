import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 120,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProd = process.env.NODE_ENV === 'production';
        // statement_timeout / pool size are tunable per env without code edit.
        const stmtTimeoutMs = Number(
          configService.get<string>('DB_STATEMENT_TIMEOUT_MS') ?? 8000,
        );
        const poolMax = Number(
          configService.get<string>('DB_POOL_MAX') ?? 20,
        );
        const slowQueryMs = Number(
          configService.get<string>('DB_SLOW_QUERY_MS') ?? 500,
        );

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'postgres'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'babydaily'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsTableName: 'migrations',
          // Auto-run pending migrations on app boot. Set to 'true' in prod env
          // so deploys keep the schema in sync with code without manual steps.
          migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN') === 'true',
          // synchronize must stay off in prod. Override via env only if you
          // know you're applying schema changes (one-shot migration).
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true' || !isProd,
          // Pool + per-statement timeout protect against a slow query stalling
          // the whole server. pg driver options are passed through `extra`.
          extra: {
            max: poolMax,
            statement_timeout: stmtTimeoutMs,
            // idle_in_transaction guards against forgotten BEGIN blocks.
            idle_in_transaction_session_timeout: 10_000,
            connectionTimeoutMillis: 5_000,
          },
          // Surface slow queries in container logs so you can find the culprit
          // without enabling full query logging.
          maxQueryExecutionTime: slowQueryMs,
          logging: ['error', 'warn', 'migration'],
        };
      },
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
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
