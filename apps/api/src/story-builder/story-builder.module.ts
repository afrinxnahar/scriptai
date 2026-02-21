import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StoryBuilderService } from './story-builder.service';
import { StoryBuilderController } from './story-builder.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule,
    BullModule.registerQueue({ name: 'story-builder' }),
  ],
  controllers: [StoryBuilderController],
  providers: [StoryBuilderService],
})
export class StoryBuilderModule {}
