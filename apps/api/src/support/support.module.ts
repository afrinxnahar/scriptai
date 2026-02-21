import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [SupabaseModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
