const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBillingTable() {
  try {
    // Try to query the billing table with limit 0 to just get column info
    const { data, error } = await supabase
      .from('billing')
      .select('*')
      .limit(0);
    
    if (error) {
      console.error('Error querying billing table:', error);
      return;
    }
    
    console.log('✅ Billing table exists and is queryable');
    console.log('Data structure (even if empty):', data);
    
    // Try to get a single record to see the actual structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('billing')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error getting sample data:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('Sample record structure:', Object.keys(sampleData[0]));
      console.log('Sample data:', sampleData[0]);
    } else {
      console.log('No data in billing table yet');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBillingTable();