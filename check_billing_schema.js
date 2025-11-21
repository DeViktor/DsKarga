const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTableSchema() {
  try {
    // Get table structure from information_schema
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'billing')
      .order('ordinal_position');
    
    if (error) {
      console.error('Error getting table schema:', error);
      return;
    }
    
    console.log('=== BILLING TABLE STRUCTURE ===');
    console.log('Column Name | Data Type | Nullable | Default');
    console.log('---|---|---|---');
    data.forEach(col => {
      console.log(`${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || 'NULL'}`);
    });
    
    // Also get any constraints
    const { data: constraints } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'billing');
    
    console.log('\n=== CONSTRAINTS ===');
    constraints.forEach(constraint => {
      console.log(`${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getTableSchema();