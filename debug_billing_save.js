const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugBillingSave() {
  console.log('=== DEBUGGING BILLING SAVE ISSUE ===\n');
  
  try {
    // First, let's check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('billing')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Cannot connect to billing table:', testError);
      console.log('Error details:', JSON.stringify(testError, null, 2));
    } else {
      console.log('✅ Successfully connected to billing table');
      console.log('Sample data:', testData);
    }
    
    // Try to get table info using a different approach
    console.log('\n2. Trying alternative table info query...');
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'billing' });
      
      if (tableError) {
        console.log('RPC failed:', tableError);
      } else if (tableInfo) {
        console.log('Table info:', tableInfo);
      }
    } catch (rpcErr) {
      console.log('RPC not available, continuing...');
    }
    
    // Let's try a minimal insert to see what happens
    console.log('\n3. Testing minimal insert...');
    const minimalPayload = {
      document_type: 'Fatura',
      billing_number: 'TEST-001',
      issue_date: new Date().toISOString(),
      status: 'Emitida',
      created_at: new Date().toISOString(),
      subtotal: 100,
      tax_amount: 14,
      total_amount: 114
    };
    
    console.log('Minimal payload:', JSON.stringify(minimalPayload, null, 2));
    
    const { data: insertData, error: insertError } = await supabase
      .from('billing')
      .insert(minimalPayload)
      .select('id, billing_number');
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError);
      console.log('Error type:', typeof insertError);
      console.log('Error keys:', Object.keys(insertError));
      console.log('Error string:', JSON.stringify(insertError, null, 2));
      
      // Try to extract more details
      if (insertError.code) console.log('Error code:', insertError.code);
      if (insertError.message) console.log('Error message:', insertError.message);
      if (insertError.details) console.log('Error details:', insertError.details);
      if (insertError.hint) console.log('Error hint:', insertError.hint);
      
    } else {
      console.log('✅ Insert successful!');
      console.log('Inserted data:', insertData);
    }
    
  } catch (err) {
    console.log('❌ Caught exception:', err);
    console.log('Exception type:', typeof err);
    console.log('Exception keys:', Object.keys(err || {}));
    console.log('Exception string:', JSON.stringify(err, null, 2));
    
    if (err instanceof Error) {
      console.log('Error name:', err.name);
      console.log('Error message:', err.message);
      console.log('Error stack:', err.stack);
    }
  }
  
  console.log('\n=== DEBUG COMPLETE ===');
}

debugBillingSave();