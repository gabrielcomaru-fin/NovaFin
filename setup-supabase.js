#!/usr/bin/env node

/**
 * Script de configuração do Supabase para NovaFin
 * Execute: node setup-supabase.js
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 Configuração do Supabase - NovaFin\n');
  
  // Verificar se .env já existe
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('❓ Arquivo .env já existe. Sobrescrever? (s/N): ');
    if (overwrite.toLowerCase() !== 's') {
      console.log('✅ Configuração cancelada.');
      rl.close();
      return;
    }
  }

  console.log('📋 Insira as credenciais do seu projeto Supabase:\n');
  console.log('💡 Você pode encontrar essas informações em:');
  console.log('   https://supabase.com/dashboard/project/[seu-projeto]/settings/api\n');

  const supabaseUrl = await question('🔗 URL do Supabase: ');
  const supabaseAnonKey = await question('🔑 Chave Anônima: ');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ URL e chave são obrigatórios!');
    rl.close();
    return;
  }

  // Validar formato da URL
  if (!supabaseUrl.includes('supabase.co')) {
    console.log('⚠️  URL parece inválida. Certifique-se de usar a URL correta do Supabase.');
  }

  // Criar arquivo .env
  const envContent = `# Configuração do Supabase - NovaFin
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Configuração do App
VITE_APP_NAME=NovaFin
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development

# URLs de redirecionamento
VITE_REDIRECT_URL_BASE=http://localhost:5173
`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Arquivo .env criado com sucesso!');
  
  // Verificar se as dependências estão instaladas
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('\n📦 Instalando dependências...');
    exec('npm install', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Erro ao instalar dependências:', error.message);
        return;
      }
      console.log('✅ Dependências instaladas!');
    });
  }

  console.log('\n🎯 Próximos passos:');
  console.log('1. Execute: npm run dev');
  console.log('2. Acesse: http://localhost:5173');
  console.log('3. Configure as tabelas no Supabase (veja README.md)');
  console.log('\n📚 Documentação de segurança: src/docs/SUPABASE_SECURITY.md');
  
  rl.close();
}

main().catch(console.error);
