// Teste completo do cadastro de funcionário via worker-dialog
// Para executar: node test-worker-dialog-fix.js

const { getSupabaseClient } = require('./src/lib/supabase/client');

async function testWorkerDialogFix() {
  console.log('🧪 Iniciando teste completo do worker-dialog...');
  
  try {
    const supabase = getSupabaseClient();
    
    // Dados completos como seriam enviados pelo formulário worker-dialog
    const completeWorkerData = {
      name: 'Funcionário Teste Completo ' + Date.now(),
      role: 'Supervisor de Operações',
      department: 'Operações',
      category: 'Nível 3',
      base_salary: 250000,
      contract_status: 'Ativo',
      type: 'Fixo',
      photo_url: null,
      admission_date: '2024-01-15',
      contract_type: 'Prazo Indeterminado',
      nationality: 'Angolana',
      address: 'Rua Teste, 123, Luanda',
      marital_status: 'Casado',
      birth_date: '1985-03-15',
      email: 'teste.completo@email.com',
      food_allowance: 15000,
      transport_allowance: 10000,
      shift_allowance: 5000,
      bonus: 20000,
      commission: 0,
      gender: 'Masculino',
      nif: '1234567890',
      bi: '005432123LA045',
      social_security_number: 'SS001234',
      phone: '+244 923 456 789',
      created_at: new Date().toISOString()
    };
    
    console.log('📋 Dados completos do funcionário:', JSON.stringify(completeWorkerData, null, 2));
    
    // Testar inserção com todos os campos
    const { data, error } = await supabase
      .from('workers')
      .insert([completeWorkerData])
      .select();
    
    if (error) {
      console.error('❌ Erro ao cadastrar funcionário:', error);
      console.error('📄 Detalhes do erro:', error.message);
      console.error('🔍 Código do erro:', error.code);
      return;
    }
    
    console.log('✅ Funcionário cadastrado com sucesso!');
    console.log('📊 Dados retornados:', JSON.stringify(data[0], null, 2));
    
    // Verificar se todos os campos foram salvos corretamente
    const createdWorker = data[0];
    const verificationChecks = [
      { field: 'name', expected: completeWorkerData.name, actual: createdWorker.name },
      { field: 'role', expected: completeWorkerData.role, actual: createdWorker.role },
      { field: 'department', expected: completeWorkerData.department, actual: createdWorker.department },
      { field: 'base_salary', expected: completeWorkerData.base_salary, actual: createdWorker.base_salary },
      { field: 'contract_status', expected: completeWorkerData.contract_status, actual: createdWorker.contract_status },
      { field: 'type', expected: completeWorkerData.type, actual: createdWorker.type },
      { field: 'nationality', expected: completeWorkerData.nationality, actual: createdWorker.nationality },
      { field: 'address', expected: completeWorkerData.address, actual: createdWorker.address },
      { field: 'email', expected: completeWorkerData.email, actual: createdWorker.email },
      { field: 'food_allowance', expected: completeWorkerData.food_allowance, actual: createdWorker.food_allowance },
      { field: 'transport_allowance', expected: completeWorkerData.transport_allowance, actual: createdWorker.transport_allowance },
      { field: 'bonus', expected: completeWorkerData.bonus, actual: createdWorker.bonus },
      { field: 'nif', expected: completeWorkerData.nif, actual: createdWorker.nif },
      { field: 'bi', expected: completeWorkerData.bi, actual: createdWorker.bi },
      { field: 'phone', expected: completeWorkerData.phone, actual: createdWorker.phone }
    ];
    
    console.log('\n🔍 Verificando campos salvos:');
    let allFieldsCorrect = true;
    
    verificationChecks.forEach(check => {
      const isCorrect = check.expected === check.actual || (check.expected == null && check.actual == null);
      console.log(`  ${isCorrect ? '✅' : '❌'} ${check.field}: ${check.actual} (esperado: ${check.expected})`);
      if (!isCorrect) allFieldsCorrect = false;
    });
    
    if (allFieldsCorrect) {
      console.log('\n🎉 Todos os campos foram salvos corretamente!');
    } else {
      console.log('\n⚠️  Alguns campos não foram salvos corretamente');
    }
    
    // Testar atualização com os mesmos dados
    console.log('\n🔄 Testando atualização do funcionário...');
    
    const updatedData = {
      ...completeWorkerData,
      role: 'Gerente de Operações',
      base_salary: 300000,
      bonus: 25000
    };
    
    const { data: updatedDataResult, error: updateError } = await supabase
      .from('workers')
      .update(updatedData)
      .eq('id', createdWorker.id)
      .select();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar funcionário:', updateError);
    } else {
      console.log('✅ Funcionário atualizado com sucesso!');
      console.log('📊 Novo cargo:', updatedDataResult[0].role);
      console.log('📊 Novo salário:', updatedDataResult[0].base_salary);
      console.log('📊 Novo bônus:', updatedDataResult[0].bonus);
    }
    
    // Limpar - remover o funcionário de teste
    await supabase
      .from('workers')
      .delete()
      .eq('id', createdWorker.id);
    
    console.log('\n🧹 Funcionário de teste removido');
    console.log('\n✅ Teste concluído com sucesso! O worker-dialog deve funcionar corretamente agora.');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
    console.error('📄 Stack:', error.stack);
  }
}

// Executar o teste
testWorkerDialogFix();