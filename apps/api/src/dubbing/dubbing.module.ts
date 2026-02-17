import { Module } from '@nestjs/common';
import { DubbingService } from './dubbing.service';
import { DubbingController } from './dubbing.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [DubbingService],
  controllers: [DubbingController],
})
export class DubbingModule { }