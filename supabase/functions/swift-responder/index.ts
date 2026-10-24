import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

/**
 * CORS por lista de origens, no lugar do `*` que havia aqui antes.
 *
 * O que isto protege, e o que NAO protege: CORS nao e controle de acesso.
 * Ele diz ao NAVEGADOR se o JavaScript de uma pagina pode LER a resposta.
 * Nao impede ninguem de chamar o endpoint — curl, script e servidor passam
 * longe disto. Quem defende de verdade este endpoint e o que ja estava aqui:
 * resposta unica para todo erro, piso de tempo, teto de tentativas, hash
 * comparado em tempo constante e identidade vinda do `user_id` da linha.
 *
 * O ganho real da lista e contra phishing: uma pagina que convenca a pessoa a
 * digitar o codigo nao consegue mais LER os tokens de sessao da resposta.
 *
 * `APP_URL` entra primeiro porque e a origem de producao de verdade; o resto
 * da lista e o que ja aparece no codigo (o dominio padrao da Vercel), o
 * dominio proprio e as duas portas de desenvolvimento.
 */
const ORIGENS_PERMITIDAS = [
  Deno.env.get('APP_URL'),
  'https://rafael-almeida-nine.vercel.app',
  'https://app.carulaconfeitaria.com.br',
  'https://carulaconfeitaria.com.br',
  'https://www.carulaconfeitaria.com.br',
  'http://localhost:3000',
  'http://localhost:5173',
]
  .filter((o): o is string => !!o)
  .map((o) => o.replace(/\/+$/, ''));

/**
 * Monta os cabecalhos de CORS para ESTA requisicao.
 *
 * Tres casos:
 *
 * 1. Origem na lista -> ecoa a origem. O navegador libera a leitura.
 * 2. Origem AUSENTE ou literalmente `null` -> responde `*`. E o caso do PWA
 *    instalado, que em algumas combinacoes de aparelho e navegador manda
 *    `Origin: null` ou nao manda nada — e esse e justamente o publico que o
 *    app quer atender. Bloquear aqui derrubaria o login de quem instalou o
 *    app na tela inicial.
 * 3. Origem presente e FORA da lista -> nenhum cabecalho de CORS. A funcao
 *    responde igual (nao e 403: CORS nao e autorizacao, e recusar aqui so
 *    mudaria o sintoma), mas o navegador recusa entregar a resposta para a
 *    pagina que chamou.
 *
 * `Vary: Origin` sempre, senao um cache intermediario pode servir a resposta
 * de uma origem para outra.
 */
function corsPara(req: Request): Record<string, string> {
  const base = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };

  const origem = req.headers.get('origin');

  if (!origem || origem === 'null') {
    return { ...base, 'Access-Control-Allow-Origin': '*' };
  }

  const normalizada = origem.replace(/\/+$/, '');
  if (ORIGENS_PERMITIDAS.includes(normalizada)) {
    return { ...base, 'Access-Control-Allow-Origin': origem };
  }

  return base;
}

/** Erros nunca dizem QUAL parte falhou. Ver `responderGenerico`. */
const MENSAGEM_GENERICA = 'Código inválido ou expirado';
const MAX_TENTATIVAS = 5;

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/**
 * Mesma resposta para e-mail inexistente, codigo errado, codigo expirado e
 * codigo ja usado.
 *
 * Distinguir esses casos transformaria o endpoint num oraculo: qualquer um
 * poderia descobrir quem e cliente mandando e-mails ao acaso e olhando a
 * mensagem. O atraso ate um piso comum serve ao mesmo fim no eixo do tempo —
 * sem ele, "e-mail nao existe" responderia na hora e "codigo errado" so depois
 * da consulta, e a diferenca entregaria a informacao de novo.
 */
async function responderGenerico(inicio: number, cors: Record<string, string>) {
  const PISO_MS = 350;
  const decorrido = Date.now() - inicio;
  if (decorrido < PISO_MS) {
    await new Promise((r) => setTimeout(r, PISO_MS - decorrido));
  }
  return json({ error: MENSAGEM_GENERICA }, 400, cors);
}

/** HMAC-SHA256 do codigo com o segredo do ambiente, em hexadecimal. */
async function hashDoCodigo(codigo: string): Promise<string> {
  const pepper = Deno.env.get('OTP_PEPPER');
  if (!pepper) throw new Error('OTP_PEPPER nao configurado');

  const chave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const assinatura = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(codigo));
  return Array.from(new Uint8Array(assinatura))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Comparacao em tempo constante.
 *
 * `a === b` sai no primeiro byte diferente, e esse tempo e mensuravel: com
 * tentativas suficientes da para descobrir o hash byte a byte. Aqui o laco
 * percorre o comprimento inteiro sempre, acumulando as diferencas com OU
 * exclusivo em vez de retornar cedo.
 */
function igualEmTempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}

Deno.serve(async (req) => {
  const inicio = Date.now();
  const cors = corsPara(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors);
  }

  try {
    const body = await req.json();
    const emailBruto = typeof body?.email === 'string' ? body.email : '';
    const code = typeof body?.code === 'string' ? body.code : '';

    // O e-mail da requisicao serve SO para achar a linha. Quem define de quem
    // e a sessao e o `user_id` gravado nela — ver mais abaixo.
    const email = emailBruto.trim().toLowerCase();

    if (!email || !code || code.length !== 6) {
      return await responderGenerico(inicio, cors);
    }

    // `used IS NOT TRUE` e nao `used = false`: a coluna e NULLABLE, e uma linha
    // com NULL continua valendo como nao usada.
    //
    // `eq` e nao `ilike`: o e-mail ja chega normalizado e o webhook grava
    // normalizado. Com `ilike`, um `%` no e-mail enviado viraria curinga e
    // casaria linhas de outras pessoas.
    const { data: candidatas, error: queryError } = await supabase
      .from('otp_codes')
      .select('id, user_id, code_hash, tentativas')
      .eq('email', email)
      .or('used.is.null,used.eq.false')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (queryError) {
      console.error('Erro ao consultar otp_codes');
      return json({ error: 'Erro interno' }, 500, cors);
    }

    if (!candidatas || candidatas.length === 0) {
      return await responderGenerico(inicio, cors);
    }

    const hashRecebido = await hashDoCodigo(code);

    // Percorre TODAS as candidatas, sem sair cedo: parar na primeira que bate
    // devolveria tempos diferentes conforme a posicao da linha certa.
    let acertou: { id: string; user_id: string } | null = null;
    for (const linha of candidatas) {
      if (linha.code_hash && igualEmTempoConstante(linha.code_hash, hashRecebido)) {
        acertou = { id: linha.id, user_id: linha.user_id };
      }
    }

    if (!acertou) {
      // Cada erro conta. Em MAX_TENTATIVAS a linha morre: sem isso, seis
      // digitos caem por tentativa e erro em pouco tempo.
      for (const linha of candidatas) {
        const tentativas = (linha.tentativas ?? 0) + 1;
        await supabase
          .from('otp_codes')
          .update(
            tentativas >= MAX_TENTATIVAS
              ? { tentativas, used: true }
              : { tentativas }
          )
          .eq('id', linha.id);
      }
      return await responderGenerico(inicio, cors);
    }

    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', acertou.id);

    if (updateError) {
      console.error('Erro ao marcar codigo como usado');
      return json({ error: 'Erro interno' }, 500, cors);
    }

    // A IDENTIDADE VEM DO `user_id` DA LINHA, consultado no Auth — nunca do
    // e-mail que chegou na requisicao.
    //
    // A versao anterior gerava o magic link com o e-mail do corpo do pedido. Como
    // a politica de INSERT da tabela so conferia `user_id = auth.uid()`, sem olhar
    // o e-mail, qualquer pessoa logada podia inserir uma linha com o e-mail de
    // outra e um codigo escolhido por ela, chamar este endpoint e receber uma
    // sessao da vitima. Amarrando no `user_id`, uma linha forjada so pode
    // devolver sessao de quem a forjou.
    const { data: dono, error: donoError } = await supabase.auth.admin.getUserById(
      acertou.user_id
    );

    if (donoError || !dono?.user?.email) {
      console.error('Nao foi possivel resolver o dono do codigo');
      return json({ error: 'Erro interno' }, 500, cors);
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: dono.user.email,
      options: { redirectTo: `${Deno.env.get('APP_URL')}?type=recovery` },
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Erro ao gerar o link de sessao');
      return json({ error: 'Erro interno' }, 500, cors);
    }

    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError || !sessionData?.session?.access_token) {
      console.error('Erro ao criar a sessao');
      return json({ error: 'Erro interno' }, 500, cors);
    }

    // Sem console.log das respostas de generateLink/verifyOtp: elas carregam o
    // token de sessao inteiro, e isso ficava gravado nos logs da funcao.
    return json(
      {
        success: true,
        accessToken: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
      },
      200,
      cors
    );
  } catch (error: any) {
    console.error('Erro inesperado no verificador de codigo');
    return json({ error: 'Erro interno' }, 500, cors);
  }
});
