// Configuração de variáveis de ambiente
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  app: {
    name: 'NovaFin',
    version: '1.0.0',
    environment: import.meta.env.MODE,
  }
};

// Validação das variáveis obrigatórias (temporariamente desabilitada)
// const requiredEnvVars = [
//   'VITE_SUPABASE_URL',
//   'VITE_SUPABASE_ANON_KEY'
// ];

// const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

// if (missingVars.length > 0) {
//   throw new Error(
//     `Missing required environment variables: ${missingVars.join(', ')}\n` +
//     'Please check your .env file and ensure all required variables are set.'
//   );
// }
