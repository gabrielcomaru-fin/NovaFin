#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Carregar .env explicitamente da raiz do projeto
const envPath = path.resolve(__dirname, '..', '.env');
console.log(`🧩 Usando .env em: ${envPath}`);
loadEnv({ path: envPath });

// Fallback: parse manual do .env caso dotenv não carregue
function loadEnvManually(p) {
  try {
    const content = fs.readFileSync(p, 'utf8');
    console.log(`📄 .env tamanho: ${content.length} bytes`);
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '');
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
    console.log('🔁 Variáveis após parse manual:', Object.keys(process.env).filter(k => k.startsWith('VITE_')).join(', ') || '(nenhuma)');
  } catch {}
}

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  loadEnvManually(envPath);
}

function exit(code) {
  process.exit(code);
}

function getEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Variável ausente: ${name}`);
  }
  return v;
}

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');

if (!url || !key) {
  console.error('🚨 Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
  exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

async function main() {
  console.log('🔎 Checando saúde do Supabase...');

  // 1) Ping simples: versão do PostgREST
  try {
    const resp = await fetch(`${url}/rest/v1/`, { method: 'GET' });
    console.log(`🌐 REST: ${resp.ok ? 'OK' : 'FALHA'} (${resp.status})`);
  } catch (e) {
    console.error('🌐 REST: FALHA ao conectar:', e.message);
  }

  // 2) Auth: create hash (sem autenticar)
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log(`🔐 Auth getSession: ${error ? 'FALHA' : 'OK'}`);
    if (error) console.error('   Detalhe:', error.message);
  } catch (e) {
    console.error('🔐 Auth: erro inesperado:', e.message);
  }

  // 3) DB: consulta leve em uma tabela pública conhecida (fallback para rpc health)
  try {
    const { error } = await supabase.from('categorias').select('id').limit(1);
    if (!error) {
      console.log('🗄️  DB (categorias): OK');
    } else {
      console.log('🗄️  DB (categorias): FALHA');
      console.error('   Detalhe:', error.message);
    }
  } catch (e) {
    console.error('🗄️  DB: erro inesperado:', e.message);
  }

  // 4) Storage (opcional): lista buckets
  try {
    const { data, error } = await supabase.storage.listBuckets();
    console.log(`🗂️  Storage listBuckets: ${error ? 'FALHA' : 'OK'}`);
    if (error) console.error('   Detalhe:', error.message);
    if (data) console.log(`   Buckets: ${data.length}`);
  } catch (e) {
    console.error('🗂️  Storage: erro inesperado:', e.message);
  }

  console.log('✅ Healthcheck concluído');
}

main();


