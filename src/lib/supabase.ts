import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Investigado em docs/investigacao-cors-transacoes-movimentos.md: uma conexao
// ociosa por alguns minutos (aba aberta sem trafego de rede) e derrubada em
// algum ponto entre o navegador e o Supabase, e a PRIMEIRA chamada depois
// desse intervalo falha com `TypeError: Failed to fetch` — sem nenhum
// Response, sem status, sem corpo — reportado pelo Chrome como bloqueio de
// CORS mesmo nao sendo CORS de verdade. A MESMA chamada, com o MESMO token,
// funciona instantaneamente na proxima tentativa (conexao nova).
//
// So retenta GET (leituras/`select`): repetir uma leitura e sempre seguro.
// Repetir POST/PATCH/DELETE (escritas) tem risco teorico de duplicar um
// lancamento financeiro se a falha acontecer DEPOIS do servidor processar e
// so a resposta se perder — decisao consciente do Rafael de nao correr esse
// risco, mesmo que a escrita ainda possa falhar ocasionalmente (nesse caso a
// usuaria so tenta de novo manualmente, como ja acontecia antes).
const getRequestMethod = (input: RequestInfo | URL, init?: RequestInit): string => {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== 'undefined' && input instanceof Request) return input.method.toUpperCase();
  return 'GET'; // default do fetch quando nenhum method e passado
};

const RETRY_DELAY_MS = 400;

const fetchComRetryDeLeitura: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (err) {
    // So retenta falha de rede pura (fetch nunca recebeu resposta) e so em
    // GET. Qualquer erro que ja tenha virado um Response (401, 403, 422...)
    // NAO cai aqui — esse caminho e tratado pelo proprio supabase-js, sem
    // passar pelo catch deste wrapper.
    if (!(err instanceof TypeError) || getRequestMethod(input, init) !== 'GET') {
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return fetch(input, init); // 2a e ULTIMA tentativa — se falhar de novo, propaga o erro real
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: fetchComRetryDeLeitura },
});
