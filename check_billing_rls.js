const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBillingRLS() {
  console.log('=== CHECKING BILLING TABLE RLS POLICIES ===\n');
  
  try {
    // Check current RLS policies
    console.log('1. Checking RLS policies for billing table...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'billing');
    
    if (policiesError) {
      console.log('Error getting policies:', policiesError);
    } else {
      console.log('RLS Policies found:', policies);
      
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`\nPolicy: ${policy.polname}`);
          console.log(`Type: ${policy.polcmd}`);
          console.log(`Roles: ${policy.polroles}`);
          console.log(`Using: ${policy.polqual}`);
          console.log(`With Check: ${policy.polwithcheck}`);
        });
      } else {
        console.log('No RLS policies found for billing table');
      }
    }
    
    // Check table permissions
    console.log('\n2. Checking table permissions...');
    const { data: permissions, error: permError } = await supabase
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
    
    // Check if RLS is enabled
    console.log('\n3. Checking if RLS is enabled...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'billing')
      .single();
    
    if (rlsError) {
      console.log('Error checking RLS status:', rlsError);
    } else {
      console.log('RLS Enabled:', rlsStatus?.rowsecurity);
    }
    
  } catch (err) {
    console.log('❌ Exception:', err);
    console.log('Error type:', typeof err);
    console.log('Error message:', err?.message);
  }
  
  console.log('\n=== RLS CHECK COMPLETE ===');
}

checkBillingRLS();