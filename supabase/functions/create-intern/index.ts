import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // We create a regular client to check the caller's JWT
    const normalClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user }, error: userError } = await normalClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: `Unauthorized: ${userError?.message || 'No user found'}` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ADMIN_EMAILS = ['admin@tekvora.com', 'vaibhav@tekvora.com', 'anantjain7014@gmail.com'];
    
    let isUserAdmin = ADMIN_EMAILS.includes(user.email || '');
    if (!isUserAdmin) {
      const { data: adminData } = await supabaseClient
        .from('admin_users')
        .select('email')
        .eq('email', user.email)
        .maybeSingle();
      isUserAdmin = !!adminData;
    }

    if (!isUserAdmin) {
      return new Response(JSON.stringify({ error: `Forbidden: User ${user.email} is not admin` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get the intern details from the request
    const { email, full_name, phone, internship_title, application_id } = await req.json();

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email or full_name' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let authUserId = '';
    const tempPassword = `Tvr-${Math.random().toString(36).slice(-6)}A1@`;

    // Wrap everything in a try-catch to capture the exact error message
    try {
      if (existingUser) {
        authUserId = existingUser.id;
        // Force update password so admin can give it to the intern if they forgot
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(authUserId, { password: tempPassword });
        if (updateError) {
          // If it fails (e.g. OAuth user), we ignore and just don't reset the password.
          console.error("Failed to update password:", updateError);
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name }
        });

        if (createError) {
          throw new Error(`Failed to create auth user: ${createError.message}`);
        }
        authUserId = newUser.user.id;
      }

      const internId = `TVR-INT-${String(Math.floor(10000 + Math.random() * 90000)).padStart(5, '0')}`;

      // Create Intern Profile
      const { error: profileError } = await supabaseClient.from('intern_profiles').insert({
        user_id: authUserId,
        intern_id: internId,
        full_name,
        email,
        phone,
        internship_title: internship_title || 'Internship',
        status: 'active',
        must_change_password: true,
      });

      if (profileError) {
        // Ignore conflict if it already exists, or throw
        if (profileError.code !== '23505') { // 23505 is unique violation
          throw new Error(`Failed to create intern profile: ${profileError.message} (Code: ${profileError.code})`);
        }
      }

      // Update Application Stage
      if (application_id) {
        const { error: appError } = await supabaseClient.from('internship_applications').update({ 
          stage: 'joined', 
          updated_at: new Date().toISOString() 
        }).eq('id', application_id);
        if (appError) {
          console.error("Failed to update application:", appError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          intern_id: internId,
          message: existingUser ? `Regenerated Password for existing intern: ${tempPassword}` : `Intern activated. Temp Password: ${tempPassword}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Unknown error occurred in edge function' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
