import { Module } from '@nestjs/common';
import { SubtitleService } from './subtitle.service';
import { SubtitleController } from './subtitle.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [SubtitleController],
  providers: [SubtitleService],
})
export class SubtitleModule { }
