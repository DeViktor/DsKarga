const { createClient } = require('@supabase/supabase-js');

// Use the service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndFixBillingRLS() {
  console.log('=== CHECKING AND FIXING BILLING RLS ===\n');
  
  try {
    // Check if RLS is enabled on billing table
    console.log('1. Checking RLS status...');
    const { data: rlsCheck, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'billing')
      .single();
    
    if (rlsError) {
      console.log('Error checking RLS:', rlsError);
    } else {
      console.log('RLS Enabled on billing table:', rlsCheck?.rowsecurity);
      
      if (rlsCheck?.rowsecurity) {
        console.log('⚠️  RLS is enabled - this is causing the insert failures');
      } else {
        console.log('✅ RLS is disabled - should work fine');
      }
    }
    
    // Check current permissions
    console.log('\n2. Checking current permissions...');
    const { data: permissions, error: permError } = await supabaseAdmin
      .from('information_schema.role_table_grants')
      .select('grantee, privilege_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'billing')
      .order('grantee');
    
    if (permError) {
      console.log('Error getting permissions:', permError);
    } else {
      console.log('Current permissions:');
      permissions.forEach(perm => {
        console.log(`- ${perm.grantee}: ${perm.privilege_type}`);
      });
    }
    
    // Grant necessary permissions to anon and authenticated roles
    console.log('\n3. Granting permissions...');
    
    // Grant INSERT permission to anon role (for unauthenticated users)
    console.log('Granting INSERT permission to anon role...');
    const { error: grantAnonError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'GRANT INSERT ON public.billing TO anon;'
    }).catch(() => {
      console.log('exec_sql RPC not available, trying direct SQL...');
      return { error: null };
    });
    
    if (grantAnonError) {
      console.log('Error granting anon permissions:', grantAnonError);
    } else {
      console.log('✅ Granted INSERT permission to anon role');
    }
    
    // Grant INSERT permission to authenticated role (for logged-in users)
    console.log('Granting INSERT permission to authenticated role...');
    const { error: grantAuthError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'GRANT INSERT ON public.billing TO authenticated;'
    }).catch(() => {
      console.log('exec_sql RPC not available, trying alternative...');
      return { error: null };
    });
    
    if (grantAuthError) {
      console.log('Error granting authenticated permissions:', grantAuthError);
    } else {
      console.log('✅ Granted INSERT permission to authenticated role');
    }
    
    // Alternative: Use raw SQL through the SQL editor
    console.log('\n4. Alternative approach - creating RLS policy:');
    console.log('If RLS is enabled, you need to create a policy. Run this SQL in Supabase SQL editor:');
    console.log('\n--- SQL to run in Supabase SQL Editor ---');
    console.log('-- Create RLS policy for billing table');
    console.log('CREATE POLICY "Allow insert for authenticated users" ON public.billing');
    console.log('FOR INSERT TO authenticated');
    console.log('WITH CHECK (true);');
    console.log('');
    console.log('-- Or disable RLS if not needed');
    console.log('ALTER TABLE public.billing DISABLE ROW LEVEL SECURITY;');
    console.log('--- End of SQL ---');
    
  } catch (err) {
    console.log('❌ Exception:', err);
    console.log('Error type:', typeof err);
    console.log('Error message:', err?.message);
  }
  
  console.log('\n=== RLS CHECK COMPLETE ===');
}

checkAndFixBillingRLS();