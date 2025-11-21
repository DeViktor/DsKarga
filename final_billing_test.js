const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalBillingTest() {
  console.log('=== FINAL BILLING SYSTEM TEST ===\n');
  
  try {
    // Test a realistic billing scenario similar to what the frontend would send
    const realisticPayload = {
      document_type: 'Fatura',
      billing_number: `FT 2024/${Math.floor(Math.random() * 10000)}`,
      client_id: null,
      client_name: 'Test Client',
      client_nif: '123456789',
      client_address: 'Test Address',
      client_province: 'Luanda',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      observations: 'Test invoice created by final test',
      iva_rate: 14,
      apply_retention: false,
      items: [
        {
          id: 1,
          description: 'Test Service',
          quantity: 1,
          price: 1000,
          discount: 0
        }
      ],
      subtotal: 1000,
      tax_amount: 140,
      retention_amount: 0,
      total_amount: 1140,
      status: 'Emitida',
      created_at: new Date().toISOString()
    };
    
    console.log('Testing realistic payload:');
    console.log(JSON.stringify(realisticPayload, null, 2));
    
    const { data, error } = await supabase
      .from('billing')
      .insert(realisticPayload)
      .select('id, billing_number, total_amount, status');
    
    if (error) {
      console.log('❌ Insert failed:');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error details:', error.details);
      
      // Simulate the frontend error handling
      console.log('\n🧪 Simulating frontend error handling:');
      let errorMessage = 'Não foi possível gravar a fatura no Supabase.';
      
      if (error.code === 'PGRST205') {
        errorMessage = 'Tabela de faturas não encontrada. Contacte o administrador do sistema.';
      } else if (error.code === '23502') {
        const columnName = error.details?.match(/column "([^"]+)"/)?.[1] || 'campo desconhecido';
        errorMessage = `Erro: O campo "${columnName}" é obrigatório.`;
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      console.log('User-friendly error message:', errorMessage);
      
    } else {
      console.log('✅ Insert successful!');
      console.log('Created invoice:', data);
      
      // Verify the data was saved correctly
      console.log('\n🔍 Verifying saved data...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('billing')
        .select('*')
        .eq('id', data[0].id)
        .single();
      
      if (verifyError) {
        console.log('❌ Verification failed:', verifyError);
      } else {
        console.log('✅ Data verification successful!');
        console.log('Verified data:', {
          id: verifyData.id,
          billing_number: verifyData.billing_number,
          total_amount: verifyData.total_amount,
          status: verifyData.status,
          created_at: verifyData.created_at
        });
      }
    }
    
  } catch (err) {
    console.log('❌ Exception caught:');
    console.log('Exception type:', typeof err);
    console.log('Exception message:', err?.message);
    console.log('Exception stack:', err?.stack);
  }
  
  console.log('\n=== FINAL TEST COMPLETE ===');
}

finalBillingTest();