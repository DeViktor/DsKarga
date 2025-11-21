const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateBrowserError() {
  console.log('=== SIMULATING BROWSER ERROR SCENARIOS ===\n');
  
  // Test different error scenarios that might occur in the browser
  const testCases = [
    {
      name: 'Missing required field',
      payload: {
        document_type: 'Fatura',
        // Missing billing_number - this should trigger 23502 error
        issue_date: new Date().toISOString(),
        status: 'Emitida',
        created_at: new Date().toISOString(),
        subtotal: 100,
        tax_amount: 14,
        total_amount: 114
      }
    },
    {
      name: 'Invalid data type',
      payload: {
        document_type: 'Fatura',
        billing_number: 'TEST-002',
        issue_date: 'invalid-date', // Invalid date format
        status: 'Emitida',
        created_at: new Date().toISOString(),
        subtotal: 100,
        tax_amount: 14,
        total_amount: 114
      }
    },
    {
      name: 'Duplicate billing number',
      payload: {
        document_type: 'Fatura',
        billing_number: 'TEST-001', // This should exist from previous test
        issue_date: new Date().toISOString(),
        status: 'Emitida',
        created_at: new Date().toISOString(),
        subtotal: 200,
        tax_amount: 28,
        total_amount: 228
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    console.log('Payload:', JSON.stringify(testCase.payload, null, 2));
    
    try {
      const { data, error } = await supabase
        .from('billing')
        .insert(testCase.payload)
        .select('id, billing_number');
      
      if (error) {
        console.log('❌ Error occurred:');
        console.log('Error object:', error);
        console.log('Error type:', typeof error);
        console.log('Error keys:', Object.keys(error));
        console.log('Error JSON:', JSON.stringify(error, null, 2));
        
        // Test the error handling logic from the billing page
        console.log('\n🧪 Testing frontend error handling:');
        const errorCode = error?.code || 'UNKNOWN';
        let errorMessage = 'Não foi possível gravar a fatura no Supabase.';
        
        if (error?.code === 'PGRST205') {
          errorMessage = 'Tabela de faturas não encontrada. Contacte o administrador do sistema.';
        } else if (error?.code === '23502') {
          const columnName = error?.details?.match(/column "([^"]+)"/)?.[1] || 'campo desconhecido';
          errorMessage = `Erro: O campo "${columnName}" é obrigatório.`;
        } else if (error?.message?.includes('billing')) {
          errorMessage = 'Erro na base de dados: tabela de faturas não está disponível.';
        } else if (error?.message) {
          errorMessage = `Erro: ${error.message}`;
        }
        
        console.log('Processed error message:', errorMessage);
        console.log('Error code:', errorCode);
        
      } else {
        console.log('✅ Success!');
        console.log('Inserted data:', data);
      }
      
    } catch (err) {
      console.log('❌ Exception caught:');
      console.log('Exception:', err);
      console.log('Exception type:', typeof err);
      console.log('Exception JSON:', JSON.stringify(err, null, 2));
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== TESTING COMPLETE ===');
}

simulateBrowserError();