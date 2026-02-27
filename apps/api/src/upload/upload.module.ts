import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
