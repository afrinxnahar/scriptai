import { Module } from '@nestjs/common';
import { DubbingService } from './dubbing.service';
import { DubbingController } from './dubbing.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SupabaseModule, ConfigModule],
  providers: [DubbingService],
  controllers: [DubbingController],
})
export class DubbingModule { }