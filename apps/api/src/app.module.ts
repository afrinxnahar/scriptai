import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import * as path from 'path';
import redisConfig from './config/redis.config';
import { SupabaseModule } from './supabase/supabase.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { TrainAiController } from './train-ai/train-ai.controller';
import { TrainAiModule } from './train-ai/train-ai.module';
import { AuthModule } from './auth/auth.module';
import { SubtitleModule } from './subtitle/subtitle.module';
import { DubbingModule } from './dubbing/dubbing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig],
      envFilePath: [
        '.env',
        '.env.local',
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '../../.env.local'),
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: configService.get('redis'),
        defaultJobOptions: {
          attempts: 1,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
          limiter: { max: 100, duration: 60000 }
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'train-ai'
    }),
    SupabaseModule,
    TrainAiModule,
    AuthModule,
    SubtitleModule,
    AuthModule,
    DubbingModule
  ],
  controllers: [AppController, HealthController, TrainAiController],
  providers: [AppService],
})
export class AppModule { }
