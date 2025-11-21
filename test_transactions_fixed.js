const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = "https://oaozzbzfjmcdzvpmnanm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb3p6Ynpmam1jZHp2cG1uYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTM4NDEsImV4cCI6MjA3ODM4OTg0MX0.kxyMoa6rOSRqTXApV0SI0tFPSvuTPzKiVFNUgSD16h8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTransactionCreationFixed() {
  console.log('🧪 Testando criação de transações (corrigido)...');
  console.log('='.repeat(50));
  
  try {
    // Testar criação de uma receita (sem campo reference)
    console.log('\n1. Testando criação de receita...');
    const revenueTransaction = {
      description: 'Venda de Consultoria - Teste Corrigido',
      amount: 3500.00,
      type: 'receita',
      category: 'Serviços',
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      status: 'ativo'
    };
    
    const { data: revenueData, error: revenueError } = await supabase
      .from('cash_flow_transactions')
      .insert(revenueTransaction)
      .select()
      .single();
      
    if (revenueError) {
      console.error('❌ Erro ao criar receita:', revenueError.message);
      console.error('Código:', revenueError.code);
      console.error('Detalhes:', revenueError.details);
    } else {
      console.log('✅ Receita criada com sucesso:', revenueData.id);
      console.log('Descrição:', revenueData.description);
      console.log('Valor:', revenueData.amount);
      console.log('Tipo:', revenueData.type);
      console.log('Data:', revenueData.transaction_date);
      
      // Limpar transação de teste
      await supabase
        .from('cash_flow_transactions')
        .delete()
        .eq('id', revenueData.id);
      console.log('✅ Transação de teste removida');
    }
    
    // Testar criação de uma despesa
    console.log('\n2. Testando criação de despesa...');
    const expenseTransaction = {
      description: 'Compra de Material - Teste Corrigido',
      amount: 450.00,
      type: 'despesa',
      category: 'Material',
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      status: 'ativo'
    };
    
    const { data: expenseData, error: expenseError } = await supabase
      .from('cash_flow_transactions')
      .insert(expenseTransaction)
      .select()
      .single();
      
    if (expenseError) {
      console.error('❌ Erro ao criar despesa:', expenseError.message);
      console.error('Código:', expenseError.code);
      console.error('Detalhes:', expenseError.details);
    } else {
      console.log('✅ Despesa criada com sucesso:', expenseData.id);
      console.log('Descrição:', expenseData.description);
      console.log('Valor:', expenseData.amount);
      console.log('Tipo:', expenseData.type);
      console.log('Data:', expenseData.transaction_date);
      
      // Limpar transação de teste
      await supabase
        .from('cash_flow_transactions')
        .delete()
        .eq('id', expenseData.id);
      console.log('✅ Transação de teste removida');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 Testes concluídos - Transações funcionando!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar testes
testTransactionCreationFixed();