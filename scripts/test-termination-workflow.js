/*
  Teste automatizado do fluxo de aprovação de desligamentos
  - Lê variáveis de .env.local
  - Consulta trabalhadores
  - Consulta solicitações de desligamento
  - Cria uma nova solicitação para o primeiro trabalhador
  - Verifica criação e mostra como aprovar/rejeitar
*/

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Carregar .env.local sem vazar segredos nos logs
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('Arquivo .env.local não encontrado.');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usar service role para garantir permissões de teste (não expor em logs)
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Variáveis de ambiente do Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('--- Teste: Fluxo de Aprovação de Desligamento ---');

  // 1) Verificar trabalhadores
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select('id, name, role, department, contract_status')
    .order('created_at', { ascending: false })
    .limit(5);
  if (workersError) throw workersError;
  console.log(`Trabalhadores encontrados: ${workers?.length || 0}`);
  if (workers && workers.length > 0) {
    workers.forEach(w => console.log(`- ${w.id} | ${w.name} | ${w.department} | ${w.contract_status}`));
  } else {
    console.log('Nenhum trabalhador encontrado. Crie um trabalhador antes de testar.');
    return;
  }

  const worker = workers[0];

  // 2) Verificar solicitações pendentes
  const { data: pendingBefore, error: pendingErrBefore } = await supabase
    .from('termination_requests')
    .select('id, worker_id, worker_name, status, request_date')
    .eq('status', 'Pendente')
    .order('created_at', { ascending: false })
    .limit(10);
  if (pendingErrBefore) throw pendingErrBefore;
  console.log(`Solicitações pendentes antes: ${pendingBefore?.length || 0}`);

  // 3) Criar solicitação de desligamento
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: created, error: createErr } = await supabase
    .from('termination_requests')
    .insert({
      worker_id: worker.id,
      worker_name: worker.name,
      termination_date: todayStr,
      reason: 'mutuo-acordo',
      notes: 'Teste automático de fluxo',
      final_feedback: 'N/A',
      status: 'Pendente',
      request_date: todayStr,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, worker_id, worker_name, status, request_date')
    .single();
  if (createErr) throw createErr;
  console.log('Solicitação criada:', created);

  // 4) Verificar se aparece entre pendentes
  const { data: pendingAfter, error: pendingErrAfter } = await supabase
    .from('termination_requests')
    .select('id, worker_id, worker_name, status, request_date')
    .eq('status', 'Pendente')
    .order('created_at', { ascending: false })
    .limit(10);
  if (pendingErrAfter) throw pendingErrAfter;
  const found = (pendingAfter || []).some(r => r.id === created.id);
  console.log(`Solicitação recém-criada está listada como pendente: ${found ? 'SIM' : 'NÃO'}`);

  if (process.env.ONLY_CREATE === '1') {
    console.log('Modo ONLY_CREATE=1: criação concluída, sem aprovar/rejeitar.');
    console.log('--- Fim do teste ---');
    return;
  }
  // 5) Aprovar e depois reverter para pendente (apenas validação de backend)
  const { error: approveErr } = await supabase
    .from('termination_requests')
    .update({ status: 'Aprovado', updated_at: new Date().toISOString() })
    .eq('id', created.id);
  if (approveErr) throw approveErr;
  console.log('Solicitação aprovada via backend.');

  // Atualizar status do trabalhador como parte do fluxo aprovado
  const { error: workerUpdateErr } = await supabase
    .from('workers')
    .update({ contract_status: 'Concluído', updated_at: new Date().toISOString() })
    .eq('id', worker.id);
  if (workerUpdateErr) throw workerUpdateErr;
  console.log('Trabalhador marcado como Concluído após aprovação.');

  // Rejeitar (apenas para validar transição)
  const { error: rejectErr } = await supabase
    .from('termination_requests')
    .update({ status: 'Rejeitado', updated_at: new Date().toISOString() })
    .eq('id', created.id);
  if (rejectErr) throw rejectErr;
  console.log('Solicitação rejeitada via backend (teste).');

  console.log('--- Fim do teste ---');
}

main().catch(err => {
  console.error('Falha no teste:', err?.message || err);
  process.exit(1);
});