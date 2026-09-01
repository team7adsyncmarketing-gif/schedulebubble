import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Must use service role key in backend

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase env vars, please check your .env');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
