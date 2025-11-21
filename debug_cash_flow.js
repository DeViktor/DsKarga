const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCashFlow() {
  console.log('🔍 Debugando Fluxo de Caixa - Supabase');
  console.log('='.repeat(50));
  
  try {
    // 1. Testar autenticação
    console.log('\n1. Testando autenticação...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro de autenticação:', userError);
    } else if (user) {
      console.log('✅ Usuário autenticado:', user.email);
    } else {
      console.log('⚠️  Usuário não autenticado (sessão anônima)');
    }
    
    // 2. Verificar tabelas existentes
    console.log('\n2. Verificando tabelas existentes...');
    const tables = ['cash_flow_transactions', 'billing', 'journal_entries'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error(`❌ ${tableName}:`, error.message);
          if (error.code) console.error(`   Código: ${error.code}`);
        } else {
          console.log(`✅ ${tableName}: ${data?.length || 0} registros`);
        }
      } catch (err) {
        console.error(`❌ Erro ao acessar ${tableName}:`, err.message);
      }
    }
    
    // 3. Verificar schema da tabela cash_flow_transactions
    console.log('\n3. Verificando schema de cash_flow_transactions...');
    try {
      const { data, error } = await supabase
        .from('cash_flow_transactions')
        .select('*')
        .limit(1);
        
      if (error) {
        console.error('❌ Erro ao buscar schema:', error);
      } else if (data && data.length > 0) {
        console.log('✅ Schema encontrado:');
        const columns = Object.keys(data[0]);
        console.log('   Colunas:', columns.join(', '));
      } else {
        console.log('ℹ️  Tabela existe mas está vazia');
      }
    } catch (err) {
      console.error('❌ Erro ao verificar schema:', err);
    }
    
    // 4. Testar permissões RLS
    console.log('\n4. Testando permissões RLS...');
    
    // Testar como usuário anônimo
    console.log('   Testando como anon...');
    try {
      const { data, error } = await supabase
        .from('cash_flow_transactions')
        .select('*')
        .limit(1);
        
      if (error) {
        console.error('   ❌ Anon - Erro:', error.message);
        if (error.code === '42501') {
          console.log('   ⚠️  RLS bloqueando acesso anônimo');
        }
      } else {
        console.log('   ✅ Anon - Acesso permitido');
      }
    } catch (err) {
      console.error('   ❌ Anon - Exception:', err.message);
    }
    
    // 5. Verificar políticas RLS (se possível)
    console.log('\n5. Verificando políticas RLS...');
    try {
      // Tentar executar uma query direta no sistema de políticas
      const { data, error } = await supabase
        .rpc('get_policies', { table_name: 'cash_flow_transactions' });
        
      if (error) {
        console.log('ℹ️  Não foi possível verificar políticas diretamente');
      } else {
        console.log('✅ Políticas encontradas:', data);
      }
    } catch (err) {
      console.log('ℹ️  Função get_policies não disponível');
    }
    
    // 6. Testar inserção
    console.log('\n6. Testando inserção de transação...');
    try {
      const testTransaction = {
        description: 'Teste de transação',
        amount: 100.00,
        type: 'receita',
        category: 'Teste',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('cash_flow_transactions')
        .insert(testTransaction)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Erro ao inserir:', error.message);
        if (error.code === '42501') {
          console.log('   ⚠️  RLS bloqueando inserção');
        } else if (error.code === '23502') {
          console.log('   ⚠️  Violação de constraint NOT NULL');
        }
      } else {
        console.log('✅ Transação inserida com sucesso:', data.id);
        
        // Limpar transação de teste
        await supabase
          .from('cash_flow_transactions')
          .delete()
          .eq('id', data.id);
        console.log('✅ Transação de teste removida');
      }
    } catch (err) {
      console.error('❌ Erro ao testar inserção:', err);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🔍 Debug concluído');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar debug
debugCashFlow();