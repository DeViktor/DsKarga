const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugBillingError() {
  try {
    console.log('Testing billing save with potential issues...');
    
    // Test with missing required fields to trigger an error
    const testInvoice = {
      // Missing required billing_number field
      document_type: 'Fatura',
      client_name: 'Test Client',
      total_amount: 1000,
      created_at: new Date().toISOString()
    };
    
    console.log('Attempting to save test invoice without billing_number...');
    
    const { data, error } = await supabase
      .from('billing')
      .insert(testInvoice)
      .select('id, billing_number')
      .single();
    
    if (error) {
      console.log('❌ Error captured:');
      console.log('Error object:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error details:', error.details);
      console.log('Error hint:', error.hint);
      console.log('Error as JSON:', JSON.stringify(error, null, 2));
      
      // Test the error handling logic from the billing page
      console.log('\n--- Testing error handling logic ---');
      console.log('err instanceof Error:', error instanceof Error);
      console.log('err?.code:', error?.code);
      console.log('err?.message?.includes("billing"):', error?.message?.includes('billing'));
      
      let errorMessage = 'Não foi possível gravar a fatura no Supabase.';
      if (error?.code === 'PGRST205') {
        errorMessage = 'Tabela de faturas não encontrada. Contacte o administrador do sistema.';
      } else if (error?.message?.includes('billing')) {
        errorMessage = 'Erro na base de dados: tabela de faturas não está disponível.';
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      console.log('Final error message:', errorMessage);
      return;
    }
    
    console.log('✅ Test invoice saved successfully!');
    console.log('Data:', data);
    
    // Clean up
    await supabase.from('billing').delete().eq('id', data.id);
    console.log('Test data cleaned up.');
    
  } catch (error) {
    console.log('❌ Unexpected error caught in catch block:');
    console.log('Error object:', error);
    console.log('Error as JSON:', JSON.stringify(error, null, 2));
    console.log('Error instanceof Error:', error instanceof Error);
    console.log('Error message:', error instanceof Error ? error.message : String(error));
  }
}

debugBillingError();