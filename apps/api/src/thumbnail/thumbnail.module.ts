import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ThumbnailService } from './thumbnail.service';
import { ThumbnailController } from './thumbnail.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule,
    BullModule.registerQueue({ name: 'thumbnail' }),
  ],
  controllers: [ThumbnailController],
  providers: [ThumbnailService],
})
export class ThumbnailModule {}
