import { createClient } from 'npm:@supabase/supabase-js@2';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !currentUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (userData.role !== 'admin' && userData.role !== 'manager') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const requestBody = await req.json();
    const { userId, verify, createUser, email, password, name, role, isVerified } = requestBody;

    if (createUser) {
      if (!email || !password || !name || !role) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields for user creation' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: isVerified || false,
        user_metadata: {
          name: name,
          role: role,
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, userId: authData.user.id }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!userId || typeof verify !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data, error } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { email_confirm: verify }
    );

    if (error) {
      console.error('Error updating user:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});