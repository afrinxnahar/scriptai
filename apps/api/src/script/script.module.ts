import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScriptService } from './script.service';
import { ScriptController } from './script.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule,
    BullModule.registerQueue({ name: 'script' }),
  ],
  controllers: [ScriptController],
  providers: [ScriptService],
})
export class ScriptModule {}
