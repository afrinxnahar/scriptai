import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [SupabaseModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
