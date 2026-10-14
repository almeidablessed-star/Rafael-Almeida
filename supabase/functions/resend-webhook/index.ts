import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://cdn.jsdelivr.net/npm/resend@latest/+esm';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

/**
 * Recebe os webhooks do Resend e registra a falha ASSINCRONA de entrega.
 *
 * Por que existe: o `EMAIL_FALHOU` que ja existia so nascia quando o Resend
 * recusava NA HORA, dentro da propria chamada de envio (smart-processor e
 * resend-otp). O caso mais comum na vida real e outro: o Resend aceita,
 * responde 200, e a caixa de destino devolve depois — endereco digitado
 * errado, conta inexistente, caixa cheia. Isso so chega por webhook. Ate
 * aqui essas falhas nao apareciam em lugar nenhum: a compradora pagava, a
 * conta existia, o codigo nunca chegava, e a consulta de monitoramento
 * continuava vazia.
 *
 * Funcao separada de proposito: as outras tres falam COM o Resend (saida);
 * esta e a unica que recebe DELE (entrada), com outro contrato de seguranca.
 *
 * Precisa ser publicada com `verify_jwt = false`: quem chama e o Resend, que
 * nao tem JWT do Supabase. Quem faz o papel da autenticacao e a assinatura
 * conferida em `assinaturaConfere`.
 */

/** Resposta JSON curta — mesmo formato das outras funcoes. */
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Confere a assinatura do webhook (padrao Svix, que e o que o Resend usa).
 *
 * O conteudo assinado e `<svix-id>.<svix-timestamp>.<corpo cru>`, com
 * HMAC-SHA256 e a chave que vem depois do prefixo `whsec_`, em base64. O
 * cabecalho `svix-signature` pode trazer varias assinaturas separadas por
 * espaco (`v1,<base64>`), porque o segredo pode estar em rotacao — basta UMA
 * bater.
 *
 * A comparacao usa `crypto.subtle.verify`, nao `===` de strings: comparar
 * byte a byte em tempo variavel vaza informacao sobre a assinatura esperada.
 *
 * A janela de 5 minutos no timestamp existe contra repeticao: sem ela, quem
 * capturasse uma chamada valida poderia reenvia-la para sempre.
 */
async function assinaturaConfere(req: Request, corpoCru: string, segredo: string) {
  const id = req.headers.get('svix-id');
  const timestamp = req.headers.get('svix-timestamp');
  const assinaturas = req.headers.get('svix-signature');
  if (!id || !timestamp || !assinaturas) return false;

  const agora = Math.floor(Date.now() / 1000);
  const enviadoEm = Number(timestamp);
  if (!Number.isFinite(enviadoEm) || Math.abs(agora - enviadoEm) > 300) return false;

  const chaveBase64 = segredo.startsWith('whsec_') ? segredo.slice(6) : segredo;
  let bytesDaChave: Uint8Array;
  try {
    bytesDaChave = Uint8Array.from(atob(chaveBase64), (c) => c.charCodeAt(0));
  } catch {
    console.error('RESEND_WEBHOOK_SECRET nao esta em base64');
    return false;
  }

  const chave = await crypto.subtle.importKey(
    'raw',
    bytesDaChave,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const conteudo = new TextEncoder().encode(`${id}.${timestamp}.${corpoCru}`);

  for (const parte of assinaturas.split(' ')) {
    const [versao, valor] = parte.split(',');
    if (versao !== 'v1' || !valor) continue;
    try {
      const assinatura = Uint8Array.from(atob(valor), (c) => c.charCodeAt(0));
      if (await crypto.subtle.verify('HMAC', chave, assinatura, conteudo)) return true;
    } catch {
      // Assinatura malformada nesta posicao: tenta a proxima.
    }
  }
  return false;
}

/**
 * Aviso por e-mail para o dono, pelo mesmo caminho do erro sincrono.
 *
 * ATENCAO, igual ao que ja esta escrito nas outras funcoes: o aviso sai pelo
 * MESMO provedor que acabou de falhar a entrega. Se a causa for nossa, o
 * aviso falha junto e em silencio — por isso a linha em `assinatura_eventos`
 * e o registro que sobrevive, nao este e-mail.
 *
 * Nunca leva codigo de acesso, nome, CPF nem endereco.
 */
async function avisarFalhaDeEmail(
  tipoDoEvento: string,
  destino: string | null,
  motivo: string,
  emailId: string | null
) {
  try {
    const alerta = Deno.env.get('ALERTA_EMAIL');
    const remetente = Deno.env.get('RESEND_FROM');
    if (!alerta || !remetente) return;

    const linhas = [
      'Origem: webhook do Resend (falha assincrona)',
      'Classe: destinatario_assincrono',
      `Evento: ${tipoDoEvento}`,
      `Motivo: ${motivo}`,
      `E-mail que falhou: ${destino ?? 'desconhecido'}`,
      `Referencia (email_id do Resend): ${emailId ?? 'sem referencia'}`,
    ];

    await resend.emails.send({
      from: `Carula Confeitaria <${remetente}>`,
      to: alerta,
      subject: '[Carula] E-mail nao entregue (destinatario_assincrono)',
      text: linhas.join('\n'),
    });
  } catch {
    console.error('Falha ao enviar o aviso de e-mail nao entregue');
  }
}

/** Acha a usuaria pelo e-mail que devolveu, para a linha nao ficar solta. */
async function acharUsuariaId(email: string | null) {
  if (!email) return null;
  try {
    const { data } = await supabase.auth.admin.listUsers();
    const achada = data?.users?.find(
      (u: { email?: string | null; id: string }) =>
        (u.email || '').toLowerCase() === email.toLowerCase()
    );
    return achada?.id ?? null;
  } catch {
    // Sem vinculo a linha ainda vale: o e-mail que falhou esta gravado.
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Sem segredo nao ha como distinguir o Resend de qualquer um na internet.
  // 500 e nao 200 de proposito: o Resend reenvia o evento, entao assim que o
  // segredo for configurado os bounces represados entram sozinhos. Responder
  // 200 aqui faria o Resend considerar entregue e descartar o evento.
  const segredo = Deno.env.get('RESEND_WEBHOOK_SECRET');
  if (!segredo) {
    console.error('RESEND_WEBHOOK_SECRET nao configurado - nenhum webhook sera processado');
    return json({ error: 'Server misconfigured' }, 500);
  }

  // Corpo CRU: a assinatura e sobre os bytes exatos que chegaram. Se o JSON
  // for reserializado antes de conferir, qualquer diferenca de espaco ou de
  // ordem de chaves quebra a verificacao.
  const corpoCru = await req.text();

  if (!(await assinaturaConfere(req, corpoCru, segredo))) {
    return json({ error: 'Invalid signature' }, 401);
  }

  let corpo: Record<string, any>;
  try {
    corpo = JSON.parse(corpoCru);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const tipo: string = corpo?.type ?? '';

  // So os dois eventos que significam "nao chegou". `email.delivered` e
  // `email.sent` gerariam volume sem nenhuma decisao associada.
  if (tipo !== 'email.bounced' && tipo !== 'email.complained') {
    return json({ message: 'Event ignored', type: tipo || 'sem tipo' }, 200);
  }

  const dados = corpo?.data ?? {};
  const emailId: string | null = dados.email_id ?? dados.id ?? null;
  const destino: string | null = Array.isArray(dados.to)
    ? (dados.to[0] ?? null)
    : (dados.to ?? null);
  const motivo: string =
    typeof dados?.bounce?.message === 'string'
      ? dados.bounce.message.slice(0, 300)
      : typeof dados?.reason === 'string'
        ? dados.reason.slice(0, 300)
        : 'sem mensagem';

  // Trava de duplicidade, mesma ideia do `hotmart_event_id`: o Resend reenvia
  // o webhook ate receber 200, e sem isto o mesmo bounce viraria varias linhas
  // e varios avisos. A chave reusa a MESMA coluna, com prefixo para nunca
  // colidir com um id da Hotmart, e com o tipo no fim porque um mesmo envio
  // pode legitimamente gerar `bounced` e depois `complained`.
  //
  // Vale a mesma ressalva do caminho da Hotmart: a trava e por consulta antes
  // de gravar, nao por restricao do banco. Dois reenvios simultaneos ainda
  // poderiam passar pelos dois lados da janela.
  const chave = emailId ? `resend:${emailId}:${tipo}` : null;
  if (chave) {
    const { data: jaVisto } = await supabase
      .from('assinatura_eventos')
      .select('id')
      .eq('hotmart_event_id', chave)
      .limit(1);
    if (jaVisto?.length) {
      console.log(`Webhook ${chave} ja processado`);
      return json({ message: 'Event already processed', key: chave }, 200);
    }
  }

  const usuariaId = await acharUsuariaId(destino);

  const { error: erroAoGravar } = await supabase.from('assinatura_eventos').insert({
    hotmart_event_id: chave,
    evento: 'EMAIL_FALHOU',
    email: destino,
    usuaria_id: usuariaId,
    payload: {
      classe: 'destinatario_assincrono',
      codigo_http: null,
      motivo,
      provedor: 'resend',
      origem: 'webhook do Resend (resend-webhook)',
      tipo_do_evento: tipo,
      email_id: emailId,
      bounce_tipo: dados?.bounce?.type ?? null,
      bounce_subtipo: dados?.bounce?.subType ?? null,
    },
  });

  if (erroAoGravar) {
    // 500 para o Resend reenviar: perder o registro e pior que repetir.
    console.error('Falha ao registrar EMAIL_FALHOU do webhook:', erroAoGravar.message);
    return json({ error: 'Failed to record event' }, 500);
  }

  await avisarFalhaDeEmail(tipo, destino, motivo, emailId);

  return json({ message: 'Recorded', type: tipo }, 200);
});
