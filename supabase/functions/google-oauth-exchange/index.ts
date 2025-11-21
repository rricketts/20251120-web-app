import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing code or redirectUri' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    console.log('[OAuth Exchange] Environment check:');
    console.log('[OAuth Exchange] GOOGLE_CLIENT_ID:', clientId ? 'present' : 'MISSING');
    console.log('[OAuth Exchange] GOOGLE_CLIENT_SECRET:', clientSecret ? 'present' : 'MISSING');

    if (!clientId || !clientSecret) {
      console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
      console.error('Please configure these secrets in Supabase Dashboard:');
      console.error('1. Go to Project Settings > Edge Functions > Manage secrets');
      console.error('2. Add GOOGLE_CLIENT_ID');
      console.error('3. Add GOOGLE_CLIENT_SECRET');
      return new Response(
        JSON.stringify({
          error: 'OAuth credentials not configured',
          details: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set as Supabase secrets'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('[OAuth Exchange] Making token exchange request to Google');
    console.log('[OAuth Exchange] Redirect URI:', redirectUri);
    console.log('[OAuth Exchange] Code length:', code.length);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    console.log('[OAuth Exchange] Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[OAuth Exchange] Token exchange failed:', errorData);
      let parsedError;
      try {
        parsedError = JSON.parse(errorData);
      } catch {
        parsedError = { raw: errorData };
      }
      return new Response(
        JSON.stringify({
          error: 'Failed to exchange code for token',
          details: parsedError,
          status: tokenResponse.status
        }),
        {
          status: tokenResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('[OAuth Exchange] Token exchange successful');
    console.log('[OAuth Exchange] Has access_token:', !!tokenData.access_token);
    console.log('[OAuth Exchange] Has refresh_token:', !!tokenData.refresh_token);
    console.log('[OAuth Exchange] Expires in:', tokenData.expires_in);

    return new Response(JSON.stringify(tokenData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Error in google-oauth-exchange:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});