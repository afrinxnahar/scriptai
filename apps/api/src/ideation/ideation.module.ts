import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IdeationService } from './ideation.service';
import { IdeationController } from './ideation.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule,
    BullModule.registerQueue({ name: 'ideation' }),
  ],
  controllers: [IdeationController],
  providers: [IdeationService],
})
export class IdeationModule {}
