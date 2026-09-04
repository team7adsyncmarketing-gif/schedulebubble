import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://byctnlhugfvjxumkrmag.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y3RubGh1Z2Z2anh1bWtybWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDMwMjksImV4cCI6MjEwMzkxOTAyOX0.XFEAFoNeXV5O9m1KcimsuoyMzpJdlODPqKWPN56mq28';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
