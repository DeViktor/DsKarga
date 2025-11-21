const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oaozzbzfjmcdzvpmnanm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb3p6Ynpmam1jZHp2cG1uYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTM4NDEsImV4cCI6MjA3ODM4OTg0MX0.kxyMoa6rOSRqTXApV0SI0tFPSvuTPzKiVFNUgSD16h8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensiveBillingCheck() {
  console.log('=== COMPREHENSIVE BILLING SYSTEM CHECK ===\n');
  
  // 1. Check what billing-related tables exist
  console.log('1. CHECKING AVAILABLE BILLING TABLES...');
  const possibleBillingTables = [
    'invoices', 'billing', 'documents', 'financial_documents', 
    'sales', 'receipts', 'transactions', 'purchase_orders'
  ];
  
  for (const tableName of possibleBillingTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data) {
        console.log(`✅ ${tableName} - EXISTS`);
        if (data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        }
      } else if (error?.code === 'PGRST205') {
        console.log(`❌ ${tableName} - DOES NOT EXIST`);
      }
    } catch (err) {
      console.log(`⚠️  ${tableName} - ERROR:`, err.message);
    }
  }
  
  // 2. Test the exact insert that the billing page is trying to do
  console.log('\n2. TESTING BILLING PAGE INSERT OPERATION...');
  
  // This is the exact payload structure from the billing page
  const billingPayload = {
    document_type: 'Fatura',
    invoice_number: 'TEST-2024-001',
    client_id: null, // Will be set if client exists
    client_name: 'Cliente Teste',
    client_nif: '123456789',
    client_address: 'Rua Teste, 123',
    client_province: 'Luanda',
    issue_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
    observations: 'Test invoice from billing system',
    iva_rate: 14.00,
    apply_retention: false,
    items: JSON.stringify([
      {
        id: 'item-1',
        description: 'Serviço de Teste',
        quantity: 1,
        price: 1000.00,
        discount: 0
      }
    ]),
    subtotal: 1000.00,
    tax_amount: 140.00, // 14% of 1000
    retention_amount: 0.00,
    total_amount: 1140.00,
    status: 'Emitida',
    created_at: new Date().toISOString()
  };
  
  console.log('Testing insert with payload structure:');
  console.log('Keys:', Object.keys(billingPayload));
  
  // Test invoices table (primary target)
  try {
    console.log('\n3. TESTING INVOICES TABLE...');
    const { data, error } = await supabase
      .from('invoices')
      .insert(billingPayload)
      .select('id, invoice_number')
      .single();
    
    if (error) {
      console.log('❌ Invoices insert failed:', error.code, '-', error.message);
      if (error.code === 'PGRST205') {
        console.log('   → TABLE DOES NOT EXIST - Migration needed!');
      }
    } else {
      console.log('✅ Invoices insert successful:', data);
    }
  } catch (err) {
    console.log('❌ Invoices insert error:', err.message);
  }
  
  // 4. Check if we can use alternative tables
  console.log('\n4. CHECKING ALTERNATIVE SOLUTIONS...');
  
  // Check purchase_orders table structure
  try {
    const { data: poData, error: poError } = await supabase
      .from('purchase_orders')
      .select('*')
      .limit(1);
    
    if (!poError && poData) {
      console.log('✅ Purchase orders table available');
      console.log('   Structure:', Object.keys(poData[0] || {}));
      
      // Check if we can adapt this table for billing
      const hasRequiredFields = ['order_number', 'supplier_name', 'status', 'created_at'].every(
        field => Object.keys(poData[0] || {}).includes(field)
      );
      
      if (hasRequiredFields) {
        console.log('   → Could be adapted for billing with field mapping');
      }
    }
  } catch (err) {
    console.log('❌ Purchase orders check failed:', err.message);
  }
  
  // 5. Check current permissions
  console.log('\n5. CHECKING PERMISSIONS...');
  try {
    const { data: permData, error: permError } = await supabase
      .from('invoices')
      .select('id')
      .limit(0); // Just check permissions, not data
    
    if (permError) {
      console.log('❌ Permissions issue:', permError.code, '-', permError.message);
    } else {
      console.log('✅ Read permissions OK');
    }
  } catch (err) {
    console.log('❌ Permissions check failed:', err.message);
  }
  
  console.log('\n=== DIAGNOSIS COMPLETE ===');
  console.log('Next steps:');
  console.log('1. If invoices table does not exist → Run SQL migration');
  console.log('2. If permissions issue → Check RLS policies');
  console.log('3. If alternative table needed → Implement field mapping');
}

comprehensiveBillingCheck();