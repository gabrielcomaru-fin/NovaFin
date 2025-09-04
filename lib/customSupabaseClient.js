import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztfxiqunsvhwxrwjabel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnhpcXVuc3Zod3hyd2phYmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTQ2NjgsImV4cCI6MjA3MjMzMDY2OH0.GfR6PBU8sqfqaEHRN7QfoOJTJyb7Y3hLJ9FpiIY_5zw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);