const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = "https://oaozzbzfjmcdzvpmnanm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb3p6Ynpmam1jZHp2cG1uYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTM4NDEsImV4cCI6MjA3ODM4OTg0MX0.kxyMoa6rOSRqTXApV0SI0tFPSvuTPzKiVFNUgSD16h8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTransactionCreation() {
  console.log('🧪 Testando criação de transações...');
  console.log('='.repeat(50));
  
  try {
    // Testar criação de uma receita
    console.log('\n1. Testando criação de receita...');
    const revenueTransaction = {
      description: 'Venda de Consultoria - Teste',
      amount: 2500.00,
      type: 'receita',
      category: 'Serviços',
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      reference: 'TEST-REV-001',
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
      description: 'Compra de Material - Teste',
      amount: 350.00,
      type: 'despesa',
      category: 'Material',
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      reference: 'TEST-EXP-001',
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
      
      // Limpar transação de teste
      await supabase
        .from('cash_flow_transactions')
        .delete()
        .eq('id', expenseData.id);
      console.log('✅ Transação de teste removida');
    }
    
    // Testar listagem de transações
    console.log('\n3. Testando listagem de transações...');
    const { data: listData, error: listError } = await supabase
      .from('cash_flow_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .limit(5);
      
    if (listError) {
      console.error('❌ Erro ao listar transações:', listError.message);
    } else {
      console.log(`✅ ${listData.length} transações encontradas`);
      listData.forEach((transaction, index) => {
        console.log(`${index + 1}. ${transaction.description} - ${transaction.type} - ${transaction.amount}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 Testes concluídos');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar testes
testTransactionCreation();