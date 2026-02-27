import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StoryBuilderService } from './story-builder.service';
import { StoryBuilderController } from './story-builder.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SupabaseModule,
    ConfigModule,
    BullModule.registerQueue({ name: 'story-builder' }),
  ],
  controllers: [StoryBuilderController],
  providers: [StoryBuilderService],
})
export class StoryBuilderModule {}
