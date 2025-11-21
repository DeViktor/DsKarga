const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTransactionsTable() {
  console.log('=== VERIFICANDO TABELA DE TRANSAÇÕES ===\n');
  
  try {
    // Verificar estrutura da tabela
    console.log('1. Verificando estrutura da tabela transactions...');
    const { data: structure, error: structError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'transactions')
      .order('ordinal_position');
    
    if (structError) {
      console.log('Erro ao verificar estrutura:', structError);
    } else {
      console.log('Estrutura da tabela transactions:');
      structure.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    }
    
    // Verificar dados existentes
    console.log('\n2. Verificando dados existentes...');
    const { data: existingData, error: dataError } = await supabase
      .from('transactions')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false });
    
    if (dataError) {
      console.log('Erro ao buscar dados:', dataError);
    } else {
      console.log('Dados encontrados:', existingData?.length || 0);
      if (existingData && existingData.length > 0) {
        console.log('Exemplo de dados:', JSON.stringify(existingData[0], null, 2));
      }
    }
    
    // Verificar RLS
    console.log('\n3. Verificando RLS...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'transactions')
      .single();
    
    if (rlsError) {
      console.log('Erro ao verificar RLS:', rlsError);
    } else {
      console.log('RLS habilitado:', rlsData?.rowsecurity);
    }
    
  } catch (err) {
    console.log('❌ Exceção:', err);
  }
  
  console.log('\n=== VERIFICAÇÃO COMPLETA ===');
}

checkTransactionsTable();