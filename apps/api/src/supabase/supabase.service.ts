import { Injectable } from '@nestjs/common';
import { createSupabaseClient, getSupabaseServiceEnv } from '@repo/supabase';

@Injectable()
export class SupabaseService {
  private readonly supabase;
  private readonly adminSupabase;

  constructor() {
    const { url, key } = getSupabaseServiceEnv();
    this.supabase = createSupabaseClient(url, key);

    // Admin client with service role key for admin operations
    const { url: adminUrl, key: adminKey } = getSupabaseServiceEnv();
    if (adminUrl && adminKey) {
      this.adminSupabase = createSupabaseClient(adminUrl, adminKey);
    }
  }

  getClient() {
    return this.supabase;
  }

  getAdminClient() {
    return this.adminSupabase;
  }
}
