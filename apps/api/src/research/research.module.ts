import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';

@Module({
  imports: [SupabaseModule],
  controllers: [ResearchController],
  providers: [ResearchService],
})
export class ResearchModule {}
