import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { TrainAiProcessor } from './processor/train-ai.processor';
import { ThumbnailProcessor } from './processor/thumbnail.processor';
import { StoryBuilderProcessor } from './processor/story-builder.processor';
import { IdeationProcessor } from './processor/ideation.processor';
import { ScriptProcessor } from './processor/script.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        '.env.local',
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '../../.env.local'),
      ],
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue(
      { name: 'train-ai' },
      { name: 'thumbnail' },
      { name: 'story-builder' },
      { name: 'ideation' },
      { name: 'script' },
    ),
  ],
  providers: [TrainAiProcessor, ThumbnailProcessor, StoryBuilderProcessor, IdeationProcessor, ScriptProcessor],
})
export class WorkerModule {}