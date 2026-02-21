import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ScriptController } from './script.controller';
import { ScriptService } from './script.service';

@Module({
  imports: [SupabaseModule],
  controllers: [ScriptController],
  providers: [ScriptService],
})
export class ScriptModule {}
