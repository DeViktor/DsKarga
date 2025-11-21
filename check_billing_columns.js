const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBillingColumns() {
  try {
    console.log('Checking available columns in billing table...');
    
    // Try to get any record to see what columns exist
    const { data, error } = await supabase
      .from('billing')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying billing table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Found existing record. Available columns:');
      console.log(Object.keys(data[0]));
      console.log('Sample data:', data[0]);
    } else {
      console.log('No existing records found. Trying to insert minimal test data...');
      
      // Try with minimal required fields
      const minimalTest = {
        document_type: 'Fatura',
        total_amount: 1000,
        created_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('billing')
        .insert(minimalTest)
        .select('*')
        .single();
      
      if (insertError) {
        console.error('Error inserting minimal test data:', insertError);
        console.error('Error details:', insertError.message);
      } else {
        console.log('✅ Minimal test data inserted successfully!');
        console.log('Available columns:', Object.keys(insertData));
        console.log('Inserted data:', insertData);
        
        // Clean up
        await supabase.from('billing').delete().eq('id', insertData.id);
        console.log('Test data cleaned up.');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkBillingColumns();