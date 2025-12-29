// Utilitário simples para parse de arquivos OFX (SGML e XML)
// Retorna uma lista de transações normalizadas: { data, valor, descricao, identificador?, tipo? }

const TEXT_DECODER = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

/**
 * Lê um File ou ArrayBuffer e retorna string
 * @param {File|ArrayBuffer|string} input
 * @returns {Promise<string>}
 */
export async function readAsText(input) {
  if (typeof input === 'string') return input;
  if (typeof window !== 'undefined' && input instanceof File) {
    try {
      const text = await input.text();
      return text;
    } catch (err) {
      console.error('[OFX Parser] Erro ao ler arquivo como texto:', err);
      throw new Error(`Erro ao ler arquivo: ${err?.message || 'Arquivo pode estar corrompido'}`);
    }
  }
  if (input && input.byteLength != null) {
    if (TEXT_DECODER) return TEXT_DECODER.decode(input);
    // fallback tosco
    return String.fromCharCode.apply(null, new Uint8Array(input));
  }
  console.error('[OFX Parser] Entrada inválida:', typeof input, input);
  throw new Error('Entrada inválida para leitura de texto OFX. Selecione um arquivo .ofx válido.');
}

/**
 * Converte data OFX (ex.: 20240131120000[-03:BRST]) para ISO yyyy-mm-dd
 */
export function parseOfxDate(ofxDate) {
  if (!ofxDate) return null;
  // Pega apenas os primeiros 8 dígitos YYYYMMDD
  const m = String(ofxDate).match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  const [_, y, mo, d] = m;
  const yyyy = Number(y);
  const mm = Number(mo) - 1;
  const dd = Number(d);
  // Usa data local (apenas dia) – app trata hora como irrelevante
  const date = new Date(yyyy, mm, dd);
  return date.toISOString().split('T')[0];
}

/**
 * Converte valor OFX com ponto como separador decimal
 */
export function parseOfxAmount(raw) {
  if (raw == null) return 0;
  const n = Number(String(raw).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function extractTag(text, tag) {
  // Suporta SGML: <TAG>valor e XML: <TAG>valor</TAG>
  const sgml = new RegExp(`<${tag}>([^\r\n<]*)`, 'i');
  const m1 = text.match(sgml);
  if (m1) return m1[1].trim();
  const xml = new RegExp(`<${tag}>([\s\S]*?)<\/${tag}>`, 'i');
  const m2 = text.match(xml);
  if (m2) return m2[1].trim();
  return '';
}

/**
 * Faz split por transações no bloco <STMTTRN>...</STMTTRN>
 */
function splitTransactions(text) {
  const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi; // XML
  const matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push(m[1]);
  }
  if (matches.length) return matches;
  // fallback SGML: marcações sem fechamento explícito
  const sgmlRegex = /<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>|<\/STMTRS>|$)/gi;
  const sgmlMatches = text.match(sgmlRegex) || [];
  return sgmlMatches.map(s => s.replace(/^<STMTTRN>/i, ''));
}

/**
 * Tenta identificar se é OFX válido
 */
export function isLikelyOfx(text) {
  return /<OFX[>\s]/i.test(text) || /<OFX>/i.test(text);
}

/**
 * Parseia o conteúdo OFX para um array de transações normalizadas
 * Campos retornados: data, valor, descricao, tipo, identificador
 */
export function parseOfx(text) {
  console.log('[OFX Parser] Iniciando parse, tamanho do texto:', text?.length || 0);
  
  if (!text) {
    throw new Error('Arquivo vazio ou não pôde ser lido');
  }
  
  if (!isLikelyOfx(text)) {
    // Log mais detalhado para debug
    console.error('[OFX Parser] Arquivo não reconhecido como OFX. Primeiros 500 caracteres:', text.substring(0, 500));
    throw new Error('Arquivo OFX inválido ou não reconhecido. Verifique se o arquivo é um OFX válido do seu banco.');
  }
  
  // Extrair somente o bloco de transações
  const bankTranListMatch = (/\<banktranlist\>([\s\S]*?)\<\/banktranlist\>/i).exec(text);
  const bankTranList = bankTranListMatch?.[1] || text;
  
  console.log('[OFX Parser] Bloco BANKTRANLIST encontrado:', !!bankTranListMatch);
  
  const chunks = splitTransactions(bankTranList);
  console.log('[OFX Parser] Chunks de transação encontrados:', chunks.length);
  
  if (chunks.length === 0) {
    throw new Error('Nenhuma transação (STMTTRN) encontrada no arquivo OFX. O arquivo pode estar vazio ou em formato não suportado.');
  }
  
  const allTxs = chunks.map((ch, idx) => {
    // Trabalha sempre no texto do chunk
    const rawType = extractTag(ch, 'TRNTYPE') || extractTag(ch, 'trntype');
    const rawDt = extractTag(ch, 'DTPOSTED') || extractTag(ch, 'dtposted') || extractTag(ch, 'DTUSER');
    const rawAmt = extractTag(ch, 'TRNAMT') || extractTag(ch, 'trnamt');
    const rawMemo = extractTag(ch, 'MEMO') || extractTag(ch, 'memo') || extractTag(ch, 'NAME');
    const fitId = extractTag(ch, 'FITID') || extractTag(ch, 'fitid');

    const data = parseOfxDate(rawDt);
    const valor = parseOfxAmount(rawAmt);
    const descricao = (rawMemo || '').trim();
    const tipo = (rawType || '').toUpperCase();

    return { data, valor, descricao, tipo, identificador: fitId, _rawDt: rawDt, _rawAmt: rawAmt };
  });
  
  const txs = allTxs.filter(tx => tx.data && (tx.valor || tx.valor === 0));
  
  console.log('[OFX Parser] Transações totais:', allTxs.length, 'Válidas:', txs.length);
  
  if (allTxs.length > 0 && txs.length === 0) {
    console.warn('[OFX Parser] Transações encontradas mas nenhuma válida. Exemplos:', allTxs.slice(0, 3));
    throw new Error(`Foram encontradas ${allTxs.length} transações, mas nenhuma com data e valor válidos.`);
  }

  return txs;
}

/**
 * Utilitário principal: recebe File/string, retorna transações normalizadas
 */
export async function parseOfxFile(input) {
  try {
    console.log('[OFX Parser] Lendo arquivo...', input?.name || 'string input');
    const text = await readAsText(input);
    console.log('[OFX Parser] Arquivo lido com sucesso, tamanho:', text?.length || 0);
    return parseOfx(text);
  } catch (error) {
    console.error('[OFX Parser] Erro ao processar arquivo:', error);
    throw error;
  }
}

export default {
  readAsText,
  parseOfxDate,
  parseOfxAmount,
  parseOfx,
  parseOfxFile,
  isLikelyOfx,
};



