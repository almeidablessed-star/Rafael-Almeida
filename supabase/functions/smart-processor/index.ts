import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://cdn.jsdelivr.net/npm/resend@latest/+esm';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Only a 2xx reliably stops Hotmart from retrying, so failures that can never
// succeed on a retry are acknowledged with 200 and left in the logs, while
// genuinely transient ones return 5xx to be retried.
function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * HMAC-SHA256 do codigo com o segredo OTP_PEPPER, em hexadecimal.
 *
 * E o MESMO calculo do swift-responder: se um dos dois mudar, nenhum codigo
 * mais confere. Hash simples nao serviria — seis digitos sao mil milhoes de
 * possibilidades de menos, e uma tabela vazada cairia por forca bruta na hora.
 */
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

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateRandomPassword(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Hotmart sends the shared secret as X-HOTMART-HOTTOK. X-Hotmart-Token is kept
// as a fallback so the manual curl tests we already use keep working.
function readHottok(req: Request): string {
  return req.headers.get('X-HOTMART-HOTTOK') || req.headers.get('X-Hotmart-Token') || '';
}

// Only these grant access. Refunds, chargebacks and cancellations are
// acknowledged with 200 so Hotmart stops retrying, but create no user.
const GRANTING_EVENTS = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'];
const GRANTING_STATUSES = ['APPROVED', 'COMPLETE', 'COMPLETED'];

/**
 * Em que classe cai uma recusa do Resend.
 *
 * A diferenca decide duas coisas de peso: se a conta da compradora sobrevive e
 * se a Hotmart vai reenviar o evento.
 *
 *   'nosso'       — o problema e de configuracao nossa: chave invalida ou
 *                   revogada, dominio nao verificado, remetente recusado,
 *                   limite da nossa conta. NAO e culpa do pedido, e um reenvio
 *                   depois do conserto funciona.
 *   'destinatario'— o endereco e que nao serve: invalido, rejeitado,
 *                   suprimido. Reenviar replica a mesma recusa para sempre.
 *   'transitorio' — rede, 5xx do provedor, 429. Passa sozinho.
 *
 * Por que nao basta "4xx = definitivo", como era antes: uma chave revogada ou
 * um dominio nao verificado tambem respondem 4xx. Com a regra antiga, uma
 * configuracao quebrada faria TODAS as compradoras virarem "200, nao reenvie" —
 * o pior resultado possivel, porque cada venda perdida fica invisivel e
 * irrecuperavel. Erro nosso precisa parar a fila ate ser consertado.
 */
function classificarErroDeEmail(error: any): 'nosso' | 'destinatario' | 'transitorio' {
  const status = typeof error?.statusCode === 'number' ? error.statusCode : 0;
  const texto = `${error?.name ?? ''} ${error?.message ?? ''}`.toLowerCase();

  if (status === 429 || status >= 500 || status === 0) return 'transitorio';

  const pistasNossas = [
    'api key', 'api_key', 'unauthorized', 'forbidden', 'restricted',
    'domain', 'not verified', 'verify a domain', 'from address', 'sender',
    'quota', 'limit',
  ];
  if (status === 401 || status === 403 || pistasNossas.some((p) => texto.includes(p))) {
    return 'nosso';
  }

  // Sobrou 4xx que fala do destinatario: endereco invalido, caixa inexistente,
  // endereco na lista de supressao.
  return 'destinatario';
}

/**
 * Deixa registrado que o e-mail nao saiu.
 *
 * Guarda so motivo, codigo HTTP e provedor — nunca o corpo da mensagem nem o
 * codigo de acesso. E o unico rastro consultavel de uma compra que foi paga e
 * nao virou acesso; sem ele, o caso so existiria no log da funcao, que ninguem
 * olha por conta propria.
 */
async function registrarFalhaDeEmail(
  p: NormalizedPayload,
  classe: string,
  error: any,
  usuariaId: string | null
) {
  const { error: erroAoGravar } = await supabase.from('assinatura_eventos').insert({
    hotmart_event_id: p.eventId ? `${p.eventId}:email-falhou` : null,
    evento: 'EMAIL_FALHOU',
    email: p.email ?? null,
    usuaria_id: usuariaId,
    hotmart_transacao: p.transacao ?? null,
    hotmart_subscriber_code: p.subscriberCode ?? null,
    payload: {
      classe,
      codigo_http: error?.statusCode ?? null,
      motivo: typeof error?.message === 'string' ? error.message.slice(0, 300) : null,
      provedor: 'resend',
    },
  });
  if (erroAoGravar) console.error('Falha ao registrar EMAIL_FALHOU:', erroAoGravar.message);
}

// Eventos que TIRAM o acesso. Todos sao tratados igual: marcam a conta como
// inativa. A diferenca entre reembolso, chargeback e cancelamento importa para
// a Hotmart (dinheiro), nao para nos (acesso) — e o rastro cru de qual foi fica
// em `assinatura_eventos` de qualquer forma.
//
// PURCHASE_DELAYED (atraso) NAO entra: atraso nao e perda de acesso, e cortar
// quem so esqueceu de pagar seria pior que esperar o cancelamento vir depois.
const REVOKING_EVENTS = [
  'PURCHASE_CANCELED',
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'PURCHASE_PROTEST',
  'PURCHASE_EXPIRED',
  'SUBSCRIPTION_CANCELLATION',
];

interface NormalizedPayload {
  email?: string;
  name?: string;
  status?: string;
  event?: string;
  eventId?: string;
  affiliateCode?: string;
  transacao?: string;
  subscriberCode?: string;
}

// Tres formatos convivem aqui: o envelope de COMPRA da Hotmart (tudo sob
// `data.buyer` / `data.purchase`), o de ASSINATURA (`data.subscriber`, que o
// cancelamento usa e que NAO traz afiliado nenhum — ver
// docs/pendencia-acesso-status-default-inativo.md), e a forma chata
// { email, name, status } dos testes manuais por curl.
function normalizePayload(body: any): NormalizedPayload {
  if (body?.data) {
    const d = body.data;
    return {
      email: d.buyer?.email || d.subscriber?.email || d.subscription?.user?.email,
      name: d.buyer?.name || d.subscriber?.name,
      status: d.purchase?.status,
      event: body.event,
      eventId: body.id,
      // Array: uma venda pode ter mais de um afiliado. O primeiro e quem
      // promoveu; os demais, quando existem, sao divisao de comissao, que e
      // assunto da Hotmart e nao nosso.
      affiliateCode: d.affiliates?.[0]?.affiliate_code,
      transacao: d.purchase?.transaction,
      subscriberCode: d.subscriber?.code || d.subscription?.subscriber_code,
    };
  }

  return {
    email: body?.email,
    name: body?.name,
    status: body?.status,
    event: body?.event,
    eventId: body?.id,
    affiliateCode: body?.affiliate_code,
    subscriberCode: body?.subscriber_code,
  };
}

/**
 * Acha o id da conta a partir do que o evento trouxe.
 *
 * Prefere o `subscriber_code` da Hotmart ao e-mail: o codigo e estavel, o
 * e-mail a pessoa troca. Como `usuarias` nao guarda o codigo, a ligacao vem do
 * proprio rastro — um evento anterior da mesma assinatura que ja tenha sido
 * casado com uma conta.
 */
async function acharUsuariaId(subscriberCode?: string, email?: string): Promise<string | null> {
  if (subscriberCode) {
    const { data } = await supabase
      .from('assinatura_eventos')
      .select('usuaria_id')
      .eq('hotmart_subscriber_code', subscriberCode)
      .not('usuaria_id', 'is', null)
      .limit(1);
    if (data?.[0]?.usuaria_id) return data[0].usuaria_id;
  }

  if (!email) return null;

  // Nao ha getUserByEmail no admin do supabase-js, e `usuarias` nao guarda
  // e-mail. Paginar o auth e aceitavel nesta escala; se a base crescer, o certo
  // e indexar o e-mail numa coluna propria em vez de varrer paginas.
  const alvo = email.trim().toLowerCase();
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const achou = data.users.find((u: any) => (u.email || '').toLowerCase() === alvo);
    if (achou) return achou.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** Codigo do afiliado -> parceiro cadastrado. Afiliado desconhecido vira null. */
async function acharParceiroId(affiliateCode?: string): Promise<number | null> {
  if (!affiliateCode) return null;
  const { data } = await supabase
    .from('parceiros')
    .select('id')
    .eq('affiliate_code', affiliateCode)
    .limit(1);
  return data?.[0]?.id ?? null;
}

/**
 * Concede acesso e grava a atribuicao do parceiro.
 *
 * `parceiro_id` so e escrito quando ainda esta NULL — o `.is(null)` no filtro
 * garante isso no proprio banco, sem leitura antes da escrita: a comissao e da
 * Hotmart, aqui e so atribuicao, e a primeira venda e que vale.
 *
 * ATENCAO: a linha de `usuarias` so nasce quando a compradora entra e preenche
 * o perfil. Numa compra de conta nova este UPDATE acerta ZERO linhas, e e por
 * isso que a atribuicao tambem fica gravada em `assinatura_eventos` — e de la
 * que a etapa seguinte precisa resgatar o vinculo ao criar o perfil.
 */
async function aplicarConcessao(usuariaId: string, parceiroId: number | null) {
  const agora = new Date().toISOString();

  const { data: ativadas } = await supabase
    .from('usuarias')
    .update({ acesso_status: 'ativo', acesso_atualizado_em: agora })
    .eq('id', usuariaId)
    .select('id');

  if (!ativadas?.length) {
    console.log(`Sem perfil ainda para ${usuariaId} - vinculo fica no rastro de eventos`);
    return;
  }

  if (parceiroId) {
    await supabase
      .from('usuarias')
      .update({ parceiro_id: parceiroId })
      .eq('id', usuariaId)
      .is('parceiro_id', null);
  }
}

/**
 * Grava o evento cru. Chamado SO depois do efeito ter acontecido: e a presenca
 * da linha que marca "ja processei isto", e gravar antes faria um reenvio
 * depois de uma falha ser descartado sem nunca ter surtido efeito.
 */
async function registrarEvento(p: NormalizedPayload, body: any, usuariaId: string | null, parceiroId: number | null) {
  const { error } = await supabase.from('assinatura_eventos').insert({
    hotmart_event_id: p.eventId ?? null,
    evento: p.event ?? 'DESCONHECIDO',
    email: p.email ?? null,
    usuaria_id: usuariaId,
    parceiro_id: parceiroId,
    hotmart_transacao: p.transacao ?? null,
    hotmart_subscriber_code: p.subscriberCode ?? null,
    payload: body,
  });
  if (error) console.error('Falha ao registrar evento (efeito ja aplicado):', error.message);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const secret = Deno.env.get('HOTMART_SECRET_KEY');
  if (!secret) {
    console.error('HOTMART_SECRET_KEY is not configured');
    return json({ error: 'Server misconfigured' }, 500);
  }

  // Remetente conferido AQUI, antes de criar qualquer coisa.
  //
  // Nao ha mais queda silenciosa para o remetente de teste: ele so entregava ao
  // dono da conta Resend, entao uma compradora de verdade nunca receberia o
  // codigo — e o sintoma aparecia como "comprei e nao recebi nada", sem rastro
  // de erro em lugar nenhum. Falhar alto e melhor que entregar no vazio.
  //
  // 500, e nao 200: a Hotmart reenvia o evento. Secret faltando e configuracao,
  // nao defeito do pedido; quando ele for definido, o reenvio entra sozinho e a
  // compradora recebe o acesso sem ninguem precisar reprocessar a mao.
  if (!Deno.env.get('RESEND_FROM')) {
    console.error('RESEND_FROM nao configurado - nenhum e-mail sera enviado');
    return json({ error: 'Server misconfigured' }, 500);
  }

  // Mesmo motivo, para o segredo do hash: sem ele, `hashDoCodigo` so estouraria
  // la na frente, DEPOIS de a conta ja estar criada — e o catch de erro faria o
  // rollback apagar a conta de uma compradora que pagou. Conferir aqui recusa o
  // evento antes de tocar em qualquer coisa, e o 500 faz a Hotmart reenviar
  // assim que o segredo existir.
  if (!Deno.env.get('OTP_PEPPER')) {
    console.error('OTP_PEPPER nao configurado - nenhum codigo pode ser gerado');
    return json({ error: 'Server misconfigured' }, 500);
  }

  if (readHottok(req) !== secret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await req.json();
    const p = normalizePayload(body);
    const { email, name, status, event } = p;

    // A Hotmart reenvia o mesmo evento ate receber 200. Como cada reenvio traz
    // o mesmo `id`, a linha ja gravada e a prova de que este evento ja surtiu
    // efeito — e so entao ele pode ser descartado.
    if (p.eventId) {
      const { data: jaVisto } = await supabase
        .from('assinatura_eventos')
        .select('id')
        .eq('hotmart_event_id', p.eventId)
        .limit(1);
      if (jaVisto?.length) {
        console.log(`Evento ${p.eventId} ja processado`);
        return json({ message: 'Event already processed', eventId: p.eventId }, 200);
      }
    }

    // Perda de acesso. So grava o status; nada no app olha para ele ainda —
    // o bloqueio e a etapa seguinte, de proposito.
    if (event && REVOKING_EVENTS.includes(event)) {
      const usuariaId = await acharUsuariaId(p.subscriberCode, email);

      if (usuariaId) {
        const { error } = await supabase
          .from('usuarias')
          .update({ acesso_status: 'inativo', acesso_atualizado_em: new Date().toISOString() })
          .eq('id', usuariaId);
        if (error) {
          console.error('Falha ao revogar acesso:', error);
          return json({ error: 'Failed to revoke access' }, 500);
        }
      } else {
        // Conta ainda nao existe (comprou e nunca entrou) ou e-mail nao bateu.
        // Nao e erro: o evento fica registrado e a atribuicao pode ser refeita
        // a partir do rastro quando a conta aparecer.
        console.log(`Revogacao sem conta correspondente: ${email ?? p.subscriberCode}`);
      }

      await registrarEvento(p, body, usuariaId, null);
      return json({ message: 'Access revoked', event, matched: Boolean(usuariaId) }, 200);
    }

    // Eventos que nao concedem nem revogam (boleto impresso, atraso, troca de
    // plano). Ficam registrados e param de ser reenviados.
    if (event && !GRANTING_EVENTS.includes(event)) {
      console.log(`Ignoring event ${event}`);
      await registrarEvento(p, body, null, null);
      return json({ message: 'Event ignored', event }, 200);
    }

    if (!email || !name) {
      return json({ error: 'Missing required fields' }, 400);
    }

    if (!status || !GRANTING_STATUSES.includes(status.toUpperCase())) {
      console.log(`Ignoring purchase with status ${status}`);
      return json({ message: 'Status ignored', status }, 200);
    }

    // Create user with temporary password
    const tempPassword = generateRandomPassword();
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
    });

    if (createError) {
      if (createError.message?.includes('already exists')) {
        // Recompra ou renovacao de quem ja tem conta: nao ha usuario a criar,
        // mas o acesso volta e a atribuicao de parceiro ainda precisa valer.
        const existenteId = await acharUsuariaId(p.subscriberCode, email);
        const parceiroId = await acharParceiroId(p.affiliateCode);
        if (existenteId) await aplicarConcessao(existenteId, parceiroId);
        await registrarEvento(p, body, existenteId, parceiroId);
        return json({ message: 'User already exists', email }, 200);
      }
      console.error('Error creating user:', createError);
      return json({ error: 'Failed to create user' }, 500);
    }

    if (!newUser?.user) {
      return json({ error: 'Failed to create user' }, 500);
    }

    const userId = newUser.user.id;

    // From here on, any failure leaves an account that can never be accessed,
    // because the buyer would have no OTP. Roll the user back so that Hotmart's
    // retry can start over cleanly instead of hitting "already exists".
    const rollback = async (reason: string) => {
      console.error(`${reason} - rolling back user ${userId}`);
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) console.error('Rollback failed:', error);
    };

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store OTP in database
    // Guarda o HASH, nunca o codigo. O codigo em texto vai so no e-mail, e some
    // daqui em diante — enquanto ele ficava na tabela, qualquer um que lesse a
    // tabela entrava na conta de qualquer compradora.
    //
    // O e-mail entra normalizado porque o verificador procura com `eq` sobre o
    // valor normalizado; gravar com outra caixa faria o codigo nunca ser achado.
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        email: email.trim().toLowerCase(),
        code_hash: await hashDoCodigo(otp),
        user_id: userId,
        expires_at: expiresAt,
        used: false,
        tentativas: 0,
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      await rollback('OTP storage failed');
      return json({ error: 'Failed to store OTP' }, 500);
    }

    // Send email with OTP
    const appUrl = Deno.env.get('APP_URL') || 'https://rafael-almeida-nine.vercel.app';
    const emailResult = await resend.emails.send({
      // O secret guarda so o endereco; o nome de exibicao vive no codigo, para
      // trocar de dominio nao exigir lembrar do formato com os sinais de menor
      // e maior — que, de quebra, o terminal do Windows engoliria ao gravar.
      from: `Carula Confeitaria <${Deno.env.get('RESEND_FROM')}>`,
      to: email,
      subject: 'Seu Código de Acesso - Carula Confeitaria',
      html: `
        <div style="font-family: 'Manrope', sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: linear-gradient(140deg, #6E3F72, #A85E86); padding: 20px; border-radius: 20px 20px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎂 Carula Confeitaria</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <h2 style="color: #241B2B; margin-top: 0;">Bem-vindo! 🎉</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Você foi convidado a usar a plataforma Carula Confeitaria!
            </p>
            <div style="background: #f5f5f5; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">SEU CÓDIGO DE ACESSO</p>
              <p style="color: #6E3F72; font-size: 48px; font-weight: bold; margin: 0; letter-spacing: 8px;">${otp}</p>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">Este código expira em 10 minutos</p>
            </div>
            <ol style="color: #666; line-height: 1.8; margin: 30px 0;">
              <li>Acesse <strong>${appUrl}</strong></li>
              <li>Digite o código de 6 dígitos acima</li>
              <li>Defina sua senha segura</li>
              <li>Comece a gerenciar sua confeitaria!</li>
            </ol>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Se você não solicitou este código, ignore este e-mail.
            </p>
          </div>
        </div>
      `,
    });

    if (emailResult.error) {
      const classe = classificarErroDeEmail(emailResult.error);
      console.error(`Falha de e-mail (${classe}) - status ${emailResult.error?.statusCode}`);

      if (classe === 'destinatario') {
        // O endereco e que nao serve. Reenviar repete a mesma recusa para
        // sempre, entao 200 para a Hotmart parar — mas A CONTA FICA. Antes
        // disto o rollback apagava quem tinha pagado, e a venda sumia sem
        // deixar nada para tras. Com a conta viva, o reenvio de codigo resolve
        // sem precisar recriar nada.
        await registrarFalhaDeEmail(p, classe, emailResult.error, userId);
        const parceiroIdFalha = await acharParceiroId(p.affiliateCode);
        await aplicarConcessao(userId, parceiroIdFalha);
        await registrarEvento(p, body, userId, parceiroIdFalha);
        return json({ message: 'Email rejected by recipient, account kept' }, 200);
      }

      // Classes 'nosso' e 'transitorio': um reenvio tem chance de dar certo
      // depois do conserto, entao 500 e a Hotmart repete. O rollback evita
      // deixar para tras uma conta sem codigo, que faria o reenvio esbarrar em
      // "ja existe".
      //
      // E de proposito que erro NOSSO nao vire 200: com a regra antiga, uma
      // chave revogada ou um dominio nao verificado faria a Hotmart desistir de
      // TODAS as compradoras de uma vez, cada perda invisivel.
      await registrarFalhaDeEmail(p, classe, emailResult.error, null);
      await rollback(`Email delivery failed (${classe})`);
      return json({ error: 'Failed to send email' }, 500);
    }

    const parceiroId = await acharParceiroId(p.affiliateCode);
    await aplicarConcessao(userId, parceiroId);
    await registrarEvento(p, body, userId, parceiroId);

    return json(
      {
        message: 'User created successfully',
        email,
        userId,
        parceiroId,
        emailSent: true,
      },
      201
    );
  } catch (error: any) {
    console.error('Error:', error);
    return json({ error: error.message || 'Internal server error' }, 500);
  }
});
