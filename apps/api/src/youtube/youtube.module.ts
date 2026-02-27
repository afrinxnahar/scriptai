import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { YoutubeController } from './youtube.controller';
import { YoutubeService } from './youtube.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [YoutubeController],
  providers: [YoutubeService],
})
export class YoutubeModule {}
