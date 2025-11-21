const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBillingConstraints() {
  console.log('=== CHECKING BILLING TABLE CONSTRAINTS ===\n');
  
  try {
    // Get existing data to understand the current state
    console.log('1. Current data in billing table:');
    const { data: existingData, error: existingError } = await supabase
      .from('billing')
      .select('id, billing_number, issue_date, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (existingError) {
      console.log('Error getting existing data:', existingError);
    } else {
      console.log('Existing records:', existingData);
      console.log('Total records:', existingData?.length || 0);
    }
    
    // Try to insert the same billing number to see if there's a unique constraint
    console.log('\n2. Testing duplicate billing number constraint:');
    const duplicatePayload = {
      document_type: 'Fatura',
      billing_number: 'TEST-001', // This already exists
      issue_date: new Date().toISOString(),
      status: 'Emitida',
      created_at: new Date().toISOString(),
      subtotal: 300,
      tax_amount: 42,
      total_amount: 342
    };
    
    const { data: duplicateData, error: duplicateError } = await supabase
      .from('billing')
      .insert(duplicatePayload)
      .select('id, billing_number');
    
    if (duplicateError) {
      console.log('❌ Duplicate test failed:');
      console.log('Error code:', duplicateError.code);
      console.log('Error message:', duplicateError.message);
      console.log('Error details:', duplicateError.details);
      
      // Check if it's a unique constraint violation
      if (duplicateError.code === '23505') {
        console.log('✅ Unique constraint detected on billing_number');
      }
    } else {
      console.log('✅ No unique constraint on billing_number');
      console.log('Inserted duplicate:', duplicateData);
    }
    
    // Clean up test data
    console.log('\n3. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('billing')
      .delete()
      .ilike('billing_number', 'TEST-%');
    
    if (deleteError) {
      console.log('Error cleaning up:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
  } catch (err) {
    console.log('❌ Exception:', err);
    console.log('Error type:', typeof err);
    console.log('Error message:', err?.message);
  }
  
  console.log('\n=== CONSTRAINT CHECK COMPLETE ===');
}

checkBillingConstraints();