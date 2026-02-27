import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
