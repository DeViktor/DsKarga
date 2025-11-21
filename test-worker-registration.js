// Teste de cadastro de funcionário
// Para executar: node test-worker-registration.js

const { getSupabaseClient } = require('./src/lib/supabase/client');

async function testWorkerRegistration() {
  console.log('🧪 Iniciando teste de cadastro de funcionário...');
  
  try {
    const supabase = getSupabaseClient();
    
    // Dados de teste
    const testWorker = {
      name: 'Funcionário Teste ' + Date.now(),
      role: 'Estivador',
      department: 'Logística',
      category: 'Mão de Obra I',
      base_salary: 150000,
      status: 'Ativo',
      type: 'Eventual',
      created_at: new Date().toISOString()
    };
    
    console.log('📋 Dados do funcionário:', testWorker);
    
    // Testar inserção
    const { data, error } = await supabase
      .from('workers')
      .insert([testWorker])
      .select();
    
    if (error) {
      console.error('❌ Erro ao cadastrar funcionário:', error);
      return;
    }
    
    console.log('✅ Funcionário cadastrado com sucesso!');
    console.log('📊 Dados retornados:', data);
    
    // Verificar se o funcionário foi realmente criado
    const { data: verifyData, error: verifyError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', data[0].id);
    
    if (verifyError) {
      console.error('❌ Erro ao verificar funcionário:', verifyError);
      return;
    }
    
    console.log('🔍 Verificação: Funcionário encontrado no banco');
    console.log('🎉 Teste concluído com sucesso!');
    
    // Limpar - remover o funcionário de teste
    await supabase
      .from('workers')
      .delete()
      .eq('id', data[0].id);
    
    console.log('🧹 Funcionário de teste removido');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

testWorkerRegistration();