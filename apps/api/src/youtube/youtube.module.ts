import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';

@Module({
  imports: [SupabaseModule],
  controllers: [YoutubeController],
  providers: [YoutubeService],
})
export class YoutubeModule {}
