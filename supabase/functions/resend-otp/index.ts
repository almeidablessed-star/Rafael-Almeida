import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://cdn.jsdelivr.net/npm/resend@latest/+esm';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// `*` pelo mesmo motivo do swift-responder: restringir origem pode quebrar o
// PWA instalado. Registrado como pendencia em docs/.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * A MESMA resposta para todos os desfechos: e-mail enviado, e-mail inexistente,
 * intervalo minimo nao respeitado e teto diario estourado.
 *
 * Qualquer diferenca — texto, status ou tempo — transformaria o endpoint numa
 * lista de clientes: bastaria enfileirar enderecos e ver qual responde
 * diferente. Por isso ate o limite estourado responde "enviamos".
 */
const RESPOSTA_UNICA = {
  message: 'Se houver uma conta com esse e-mail, enviamos um novo código.',
};

const INTERVALO_MINIMO_MS = 60 * 1000;
const TETO_DIARIO = 5;
const VALIDADE_MS = 10 * 60 * 1000;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function gerarCodigo(): string {
  // `crypto.getRandomValues`, e nao `Math.random`: um codigo de acesso previsivel
  // nao e codigo de acesso.
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (100000 + (buf[0] % 900000)).toString();
}

/** HMAC-SHA256 do codigo com OTP_PEPPER. Igual ao das outras duas funcoes. */
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

/** Procura a conta pelo e-mail. Nao ha getUserByEmail no admin do supabase-js. */
async function acharUsuaria(email: string): Promise<{ id: string; email: string } | null> {
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const achou = data.users.find((u: any) => (u.email || '').toLowerCase() === email);
    if (achou) return { id: achou.id, email: achou.email };
    if (data.users.length < 200) return null;
  }
  return null;
}

function corpoDoEmail(codigo: string, appUrl: string): string {
  return `
    <div style="font-family: 'Manrope', sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: linear-gradient(140deg, #6E3F72, #A85E86); padding: 20px; border-radius: 20px 20px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎂 Carula Confeitaria</h1>
      </div>
      <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <h2 style="color: #241B2B; margin-top: 0;">Seu novo código</h2>
        <div style="background: #f5f5f5; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">CÓDIGO DE ACESSO</p>
          <p style="color: #6E3F72; font-size: 48px; font-weight: bold; margin: 0; letter-spacing: 8px;">${codigo}</p>
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">Este código expira em 10 minutos</p>
        </div>
        <p style="color: #666; line-height: 1.6;">
          <strong>Use sempre o código mais recente.</strong> Se você pediu mais de um,
          os anteriores deixaram de valer.
        </p>
        <p style="color: #666; line-height: 1.6;">Acesse <strong>${appUrl}</strong> e digite o código.</p>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          Se você não pediu este código, ignore este e-mail.
        </p>
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Configuracao incompleta e erro nosso, e o unico caso que foge da resposta
  // unica: aqui nao ha o que vazar, e devolver "enviamos" esconderia a falha.
  if (!Deno.env.get('RESEND_FROM') || !Deno.env.get('OTP_PEPPER')) {
    console.error('RESEND_FROM ou OTP_PEPPER nao configurado');
    return json({ error: 'Server misconfigured' }, 500);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = (typeof body?.email === 'string' ? body.email : '').trim().toLowerCase();
    if (!email) return json(RESPOSTA_UNICA, 200);

    const usuaria = await acharUsuaria(email);
    if (!usuaria) return json(RESPOSTA_UNICA, 200);

    // Limites, contados nas proprias linhas de `otp_codes` — sem tabela nova.
    // Sem eles, o botao de reenvio vira um jeito de encher a caixa de entrada
    // de qualquer pessoa cujo e-mail se conheca.
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentes } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('user_id', usuaria.id)
      .gt('created_at', desde)
      .order('created_at', { ascending: false });

    const quantidade = recentes?.length ?? 0;
    const ultimo = recentes?.[0]?.created_at ? new Date(recentes[0].created_at).getTime() : 0;

    if (quantidade >= TETO_DIARIO || Date.now() - ultimo < INTERVALO_MINIMO_MS) {
      // Mesma resposta do sucesso, de proposito: dizer "espere um minuto"
      // confirmaria que a conta existe.
      return json(RESPOSTA_UNICA, 200);
    }

    // O codigo novo mata os anteriores. Como o contador de tentativas vive por
    // linha, cada reenvio tambem recomeca a contagem em zero — e e por isso que
    // o teto diario acima precisa existir: sem ele, reenviar seria um jeito de
    // zerar o limite de tentativas a vontade.
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('user_id', usuaria.id)
      .or('used.is.null,used.eq.false');

    const codigo = gerarCodigo();
    const { error: insertError } = await supabase.from('otp_codes').insert({
      email,
      code_hash: await hashDoCodigo(codigo),
      user_id: usuaria.id,
      expires_at: new Date(Date.now() + VALIDADE_MS).toISOString(),
      used: false,
      tentativas: 0,
    });

    if (insertError) {
      console.error('Falha ao gravar o codigo novo:', insertError.message);
      return json(RESPOSTA_UNICA, 200);
    }

    // Responde ANTES de falar com o Resend. O envio leva centenas de
    // milissegundos e varia; esperar por ele faria o tempo de resposta
    // denunciar se a conta existe, que e exatamente o que a resposta unica
    // tenta esconder.
    const appUrl = Deno.env.get('APP_URL') || 'https://rafael-almeida-nine.vercel.app';
    const envio = resend.emails
      .send({
        from: `Carula Confeitaria <${Deno.env.get('RESEND_FROM')}>`,
        to: usuaria.email,
        subject: 'Seu novo código de acesso - Carula Confeitaria',
        html: corpoDoEmail(codigo, appUrl),
      })
      .then((r: any) => {
        if (r?.error) console.error('Reenvio recusado pelo Resend - status', r.error?.statusCode);
      })
      .catch((e: any) => console.error('Reenvio falhou:', e?.message));

    // @ts-ignore EdgeRuntime existe no runtime do Supabase, nao nos tipos.
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(envio);

    return json(RESPOSTA_UNICA, 200);
  } catch (error: any) {
    console.error('Erro inesperado no reenvio de codigo');
    return json(RESPOSTA_UNICA, 200);
  }
});
