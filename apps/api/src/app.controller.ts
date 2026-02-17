import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';
import { SupabaseAuthGuard } from './guards/auth.guard';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService, private readonly supabaseService: SupabaseService) { }

  @Get('test-db')
  async testDb(@Req() req) {
    const { data, error } = await this.supabaseService.getClient().from('profiles').select('*').limit(1);
    if (error) throw error;
    return data;
  }
}
