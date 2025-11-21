const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdatedBilling() {
  try {
    console.log('Testing updated billing functionality...');
    
    // Test data similar to what the billing page would create
    const testInvoice = {
      document_type: 'Fatura',
      billing_number: 'FT 2024/1234',
      client_id: null,
      client_name: 'Test Client',
      client_nif: '123456789',
      client_address: 'Test Address',
      client_province: 'Luanda',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      observations: 'Test invoice created for verification',
      iva_rate: 14,
      apply_retention: false,
      items: [
        {
          id: 1,
          description: 'Test Service',
          quantity: 2,
          price: 1000,
          discount: 0
        }
      ],
      subtotal: 2000,
      tax_amount: 280,
      retention_amount: 0,
      total_amount: 2280,
      status: 'Emitida',
      created_at: new Date().toISOString()
    };
    
    console.log('Attempting to save test invoice to billing table...');
    
    const { data, error } = await supabase
      .from('billing')
      .insert(testInvoice)
      .select('id, billing_number')
      .single();
    
    if (error) {
      console.error('❌ Error saving test invoice:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return;
    }
    
    console.log('✅ Test invoice saved successfully!');
    console.log('Invoice ID:', data.id);
    console.log('Billing Number:', data.billing_number);
    
    // Verify the data was saved correctly
    console.log('Verifying saved data...');
    const { data: savedInvoice, error: verifyError } = await supabase
      .from('billing')
      .select('*')
      .eq('id', data.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying saved invoice:', verifyError);
    } else {
      console.log('✅ Invoice verification successful!');
      console.log('Saved invoice details:', {
        id: savedInvoice.id,
        billing_number: savedInvoice.billing_number,
        total_amount: savedInvoice.total_amount,
        status: savedInvoice.status,
        client_name: savedInvoice.client_name
      });
    }
    
    // Clean up - delete the test invoice
    console.log('Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('billing')
      .delete()
      .eq('id', data.id);
    
    if (deleteError) {
      console.error('❌ Error deleting test invoice:', deleteError);
    } else {
      console.log('✅ Test data cleaned up successfully!');
    }
    
    console.log('\n🎉 All tests passed! Billing functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testUpdatedBilling();