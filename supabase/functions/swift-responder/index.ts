import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code || code.length !== 6) {
      return new Response(
        JSON.stringify({ error: 'Email and 6-digit code required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify OTP from database
    const { data: otpRecord, error: queryError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (queryError || !otpRecord) {
      console.error('OTP verification error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired code' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Error marking OTP as used:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify code' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate a magic link which returns hashed_token
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('APP_URL')}?type=recovery`,
      },
    });

    console.log('generateLink() response:', JSON.stringify(linkData, null, 2));

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Error generating link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate session', details: linkError?.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Verify the OTP token to get a real session
    // IMPORTANT: Only pass token_hash and type - do NOT pass email
    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    console.log('verifyOtp() response:', JSON.stringify(sessionData, null, 2));

    if (verifyError || !sessionData?.session?.access_token) {
      console.error('Error verifying OTP:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session', details: verifyError?.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        accessToken: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
        message: 'OTP verified successfully',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});