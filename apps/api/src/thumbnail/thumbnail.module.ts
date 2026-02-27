import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ThumbnailService } from './thumbnail.service';
import { ThumbnailController } from './thumbnail.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SupabaseModule,
    ConfigModule,
    BullModule.registerQueue({ name: 'thumbnail' }),
  ],
  controllers: [ThumbnailController],
  providers: [ThumbnailService],
})
export class ThumbnailModule {}
