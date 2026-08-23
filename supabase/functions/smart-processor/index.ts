import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://cdn.jsdelivr.net/npm/resend@latest/+esm';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Hotmart retries on 5xx but not on 4xx, so transient failures must return 5xx
// and permanent ones (bad payload, wrong secret) must return 4xx.
function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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

interface NormalizedPayload {
  email?: string;
  name?: string;
  status?: string;
  event?: string;
}

// Accepts the Hotmart 2.x envelope (everything nested under `data`) and the
// flat { email, name, status } shape used by our manual curl tests.
function normalizePayload(body: any): NormalizedPayload {
  if (body?.data) {
    return {
      email: body.data.buyer?.email,
      name: body.data.buyer?.name,
      status: body.data.purchase?.status,
      event: body.event,
    };
  }

  return {
    email: body?.email,
    name: body?.name,
    status: body?.status,
    event: body?.event,
  };
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

  if (readHottok(req) !== secret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await req.json();
    const { email, name, status, event } = normalizePayload(body);

    // Acknowledge events we deliberately do not act on, so Hotmart does not retry.
    if (event && !GRANTING_EVENTS.includes(event)) {
      console.log(`Ignoring event ${event}`);
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
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        email,
        code: otp,
        user_id: userId,
        expires_at: expiresAt,
        used: false,
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      await rollback('OTP storage failed');
      return json({ error: 'Failed to store OTP' }, 500);
    }

    // Send email with OTP
    const appUrl = Deno.env.get('APP_URL') || 'https://rafael-almeida-nine.vercel.app';
    const emailResult = await resend.emails.send({
      from: Deno.env.get('RESEND_FROM') || 'Carula Confeitaria <noreply@resend.dev>',
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
      console.error('Error sending email:', emailResult.error);
      await rollback('Email delivery failed');
      return json({ error: 'Failed to send email' }, 500);
    }

    return json(
      {
        message: 'User created successfully',
        email,
        userId,
        emailSent: true,
      },
      201
    );
  } catch (error: any) {
    console.error('Error:', error);
    return json({ error: error.message || 'Internal server error' }, 500);
  }
});
