const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBillingRequirements() {
  try {
    console.log('Checking billing table requirements...');
    
    // Try to insert a minimal record to see what fields are required
    const minimalTest = {
      billing_number: 'TEST/123',
      document_type: 'Fatura',
      total_amount: 100,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('billing')
      .insert(minimalTest)
      .select('*')
      .single();
    
    if (error) {
      console.log('❌ Error with minimal test:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      
      // Try with just the absolute minimum
      const ultraMinimal = {
        billing_number: 'TEST/456',
        document_type: 'Fatura',
        created_at: new Date().toISOString()
      };
      
      const { data: data2, error: error2 } = await supabase
        .from('billing')
        .insert(ultraMinimal)
        .select('*')
        .single();
      
      if (error2) {
        console.log('❌ Error with ultra-minimal test:', error2);
      } else {
        console.log('✅ Ultra-minimal test successful!');
        console.log('Required fields appear to be: billing_number, document_type');
        
        // Clean up
        await supabase.from('billing').delete().eq('id', data2.id);
      }
    } else {
      console.log('✅ Minimal test successful!');
      console.log('Data saved:', data);
      
      // Clean up
      await supabase.from('billing').delete().eq('id', data.id);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkBillingRequirements();