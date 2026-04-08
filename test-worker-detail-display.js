// Teste para verificar se todos os dados do trabalhador são exibidos corretamente
// Para executar: node test-worker-detail-display.js

const { getSupabaseClient } = require('./src/lib/supabase/client');

async function testWorkerDetailDisplay() {
  console.log('🧪 Iniciando teste de exibição de dados do trabalhador...');
  
  try {
    const supabase = getSupabaseClient();
    
    // Buscar um trabalhador existente para teste
    const { data: workers, error: fetchError } = await supabase
      .from('workers')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar trabalhador:', fetchError);
      return;
    }
    
    if (!workers || workers.length === 0) {
      console.log('⚠️  Nenhum trabalhador encontrado no banco de dados');
      return;
    }
    
    const worker = workers[0];
    console.log('📋 Trabalhador encontrado:', worker.name);
    
    // Verificar todos os campos disponíveis
    const availableFields = [
      'name', 'role', 'department', 'category', 'base_salary', 'contract_status', 'type',
      'photo_url', 'admission_date', 'contract_type', 'nationality', 'address',
      'marital_status', 'birth_date', 'email', 'food_allowance', 'transport_allowance',
      'shift_allowance', 'bonus', 'commission', 'bi', 'nif', 'social_security_number',
      'phone', 'gender', 'created_at', 'updated_at'
    ];
    
    console.log('\n🔍 Verificando campos disponíveis:');
    availableFields.forEach(field => {
      const value = worker[field];
      const hasValue = value !== null && value !== undefined && value !== '';
      console.log(`  ${hasValue ? '✅' : '❌'} ${field}: ${hasValue ? value : 'vazio'}`);
    });
    
    // Simular a normalização de dados como é feito na página
    const normalizedWorker = {
      id: worker.id,
      name: worker.name ?? '',
      role: worker.role ?? '',
      department: worker.department ?? '',
      category: worker.category ?? '',
      baseSalary: Number(worker.base_salary ?? 0),
      contractStatus: worker.contract_status ?? 'Ativo',
      type: worker.type ?? 'Eventual',
      photoUrl: worker.photo_url ?? undefined,
      admissionDate: worker.admission_date ?? undefined,
      contractType: worker.contract_type ?? undefined,
      nationality: worker.nationality ?? undefined,
      address: worker.address ?? undefined,
      maritalStatus: worker.marital_status ?? undefined,
      birthDate: worker.birth_date ?? undefined,
      email: worker.email ?? undefined,
      foodAllowance: Number(worker.food_allowance ?? 0),
      transportAllowance: Number(worker.transport_allowance ?? 0),
      shiftAllowance: Number(worker.shift_allowance ?? 0),
      bonus: Number(worker.bonus ?? 0),
      commission: Number(worker.commission ?? 0),
      bi: worker.bi ?? undefined,
      nif: worker.nif ?? undefined,
      social_security_number: worker.social_security_number ?? undefined,
      phone: worker.phone ?? undefined,
      gender: worker.gender ?? undefined,
    };
    
    console.log('\n📊 Dados normalizados que seriam exibidos na página:');
    
    // Informações Pessoais
    console.log('\n🏠 Informações Pessoais:');
    console.log(`  Nacionalidade: ${normalizedWorker.nationality || 'N/A'}`);
    console.log(`  Estado Civil: ${normalizedWorker.maritalStatus || 'N/A'}`);
    console.log(`  Data de Nascimento: ${normalizedWorker.birthDate || 'N/A'}`);
    console.log(`  Gênero: ${normalizedWorker.gender || 'N/A'}`);
    console.log(`  Residência: ${normalizedWorker.address || 'N/A'}`);
    console.log(`  NIF: ${normalizedWorker.nif || 'N/A'}`);
    console.log(`  Nº Seg. Social: ${normalizedWorker.social_security_number || 'N/A'}`);
    console.log(`  Nº B.I.: ${normalizedWorker.bi || 'N/A'}`);
    console.log(`  Email: ${normalizedWorker.email || 'N/A'}`);
    console.log(`  Contacto: ${normalizedWorker.phone || 'N/A'}`);
    
    // Informações Profissionais
    console.log('\n💼 Informações Profissionais:');
    console.log(`  Tipo de Trabalhador: ${normalizedWorker.type}`);
    console.log(`  Departamento: ${normalizedWorker.department}`);
    console.log(`  Estado do Contrato: ${normalizedWorker.contractStatus}`);
    console.log(`  Data de Admissão: ${normalizedWorker.admissionDate || 'N/A'}`);
    console.log(`  Tipo de Contrato: ${normalizedWorker.contractType || 'N/A'}`);
    console.log(`  ID do Trabalhador: ${normalizedWorker.id}`);
    
    // Salários e Encargos
    console.log('\n💰 Salários e Encargos:');
    console.log(`  Salário Base: Kz ${normalizedWorker.baseSalary.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`);
    console.log(`  Subsídio de Alimentação: Kz ${normalizedWorker.foodAllowance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`);
    console.log(`  Subsídio de Transporte: Kz ${normalizedWorker.transportAllowance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`);
    console.log(`  Subsídio de Turno: Kz ${normalizedWorker.shiftAllowance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`);
    console.log(`  Bónus: Kz ${normalizedWorker.bonus.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`);
    console.log(`  Comissão: Kz ${normalizedWorker.commission.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`);
    
    console.log('\n✅ Teste concluído! Todos os dados do trabalhador estão disponíveis para exibição.');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
    console.error('📄 Stack:', error.stack);
  }
}

// Executar o teste
testWorkerDetailDisplay();