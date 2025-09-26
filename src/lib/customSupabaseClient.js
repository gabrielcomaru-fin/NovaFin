import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/env';

// Fallback para desenvolvimento (REMOVER EM PRODUÇÃO)
const FALLBACK_URL = 'https://ztfxiqunsvhwxrwjabel.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnhpcXVuc3Zod3hyd2phYmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTQ2NjgsImV4cCI6MjA3MjMzMDY2OH0.GfR6PBU8sqfqaEHRN7QfoOJTJyb7Y3hLJ9FpiIY_5zw';

// Usar variáveis de ambiente ou fallback em desenvolvimento
const supabaseUrl = config.supabase.url || (config.app.environment === 'development' ? FALLBACK_URL : null);
const supabaseAnonKey = config.supabase.anonKey || (config.app.environment === 'development' ? FALLBACK_KEY : null);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '🚨 Supabase configuration missing!\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n' +
    'See .env.example for reference.'
  );
}

// Configurações de cliente otimizadas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Mais seguro para SPAs
  },
  global: {
    headers: {
      'X-Client-Info': `${config.app.name}@${config.app.version}`,
    },
  },
  // Cache para melhor performance
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});