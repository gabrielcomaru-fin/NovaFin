import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/env';

// Usar apenas variáveis de ambiente - SEM FALLBACKS HARDCODED
const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

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