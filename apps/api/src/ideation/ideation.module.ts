import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IdeationService } from './ideation.service';
import { IdeationController } from './ideation.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SupabaseModule,
    ConfigModule,
    BullModule.registerQueue({ name: 'ideation' }),
  ],
  controllers: [IdeationController],
  providers: [IdeationService],
})
export class IdeationModule {}
