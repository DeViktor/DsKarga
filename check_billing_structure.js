const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oaozzbzfjmcdzvpmnanm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb3p6Ynpmam1jZHp2cG1uYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTM4NDEsImV4cCI6MjA3ODM4OTg0MX0.kxyMoa6rOSRqTXApV0SI0tFPSvuTPzKiVFNUgSD16h8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBillingTableStructure() {
  console.log('=== CHECKING BILLING TABLE STRUCTURE ===\n');
  
  try {
    // Get the complete structure of the billing table
    const { data: billingData, error: billingError } = await supabase
      .from('billing')
      .select('*')
      .limit(5);
    
    if (billingError) {
      console.log('❌ Error accessing billing table:', billingError);
      return;
    }
    
    console.log('✅ Billing table data retrieved successfully');
    console.log('Number of records:', billingData?.length || 0);
    
    if (billingData && billingData.length > 0) {
      console.log('\n📊 Billing Table Structure:');
      const firstRecord = billingData[0];
      const columns = Object.keys(firstRecord);
      
      columns.forEach(column => {
        const value = firstRecord[column];
        const valueType = Array.isArray(value) ? 'array' : 
                         typeof value === 'object' ? 'object' : 
                         typeof value;
        console.log(`  ${column}: ${valueType} = ${JSON.stringify(value)?.substring(0, 50)}`);
      });
      
      console.log('\n📋 Sample Records:');
      billingData.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log(`  ID: ${record.id}`);
        console.log(`  Type: ${record.document_type || record.type || 'N/A'}`);
        console.log(`  Number: ${record.invoice_number || record.number || 'N/A'}`);
        console.log(`  Client: ${record.client_name || record.client || 'N/A'}`);
        console.log(`  Amount: ${record.total_amount || record.amount || 'N/A'}`);
        console.log(`  Status: ${record.status || 'N/A'}`);
        console.log(`  Date: ${record.issue_date || record.date || 'N/A'}`);
      });
    } else {
      console.log('ℹ️  Billing table exists but is empty');
    }
    
    // Check what columns are available
    if (billingData && billingData.length > 0) {
      const columns = Object.keys(billingData[0]);
      console.log('\n🔍 Available Columns Analysis:');
      
      // Check for billing-relevant columns
      const hasInvoiceNumber = columns.includes('invoice_number') || columns.includes('number');
      const hasDocumentType = columns.includes('document_type') || columns.includes('type');
      const hasClientName = columns.includes('client_name') || columns.includes('client');
      const hasTotalAmount = columns.includes('total_amount') || columns.includes('amount');
      const hasStatus = columns.includes('status');
      const hasIssueDate = columns.includes('issue_date') || columns.includes('date');
      
      console.log(`  Invoice Number: ${hasInvoiceNumber ? '✅' : '❌'}`);
      console.log(`  Document Type: ${hasDocumentType ? '✅' : '❌'}`);
      console.log(`  Client Name: ${hasClientName ? '✅' : '❌'}`);
      console.log(`  Total Amount: ${hasTotalAmount ? '✅' : '❌'}`);
      console.log(`  Status: ${hasStatus ? '✅' : '❌'}`);
      console.log(`  Issue Date: ${hasIssueDate ? '✅' : '❌'}`);
      
      const isCompatible = hasInvoiceNumber && hasDocumentType && hasClientName && hasTotalAmount;
      console.log(`\n🎯 Billing Table Compatibility: ${isCompatible ? '✅ COMPATIBLE' : '❌ NEEDS ADAPTATION'}`);
      
      if (isCompatible) {
        console.log('\n✅ The existing billing table can be used for the billing system!');
        console.log('   → Just need to update the table name from "invoices" to "billing" in the code');
      }
    }
    
  } catch (err) {
    console.error('❌ Failed to check billing table:', err.message);
  }
}

checkBillingTableStructure();