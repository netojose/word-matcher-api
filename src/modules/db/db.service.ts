import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/database.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DbService {
  constructor(private configService: ConfigService) {}

  public getClient(): SupabaseClient<Database> {
    const url = this.configService.get<string>('SUPABASE_URL');
    const roleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    return createClient<Database>(url, roleKey);
  }
}
