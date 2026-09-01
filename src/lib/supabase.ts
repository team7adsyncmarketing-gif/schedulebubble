import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bjpnwuzozlsolvpxyxgx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_m4D2gbgqYcYXmq0U4Ilpvw_J_x4j_uy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
