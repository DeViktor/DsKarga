import { getSupabaseClient } from '@/lib/supabase/client';

// Accidents
export async function addAccidentReportSupabase(data: {
  datetime: string;
  clientUnit: string;
  workerName: string;
  type: 'sem-baixa' | 'com-baixa' | 'quase-acidente';
  severity: 'leve' | 'moderado' | 'grave';
  description: string;
  probableCause: string;
}) {
  const supabase = getSupabaseClient();
  const payload = {
    // Convert datetime string to ISO to store consistently
    datetime: new Date(data.datetime).toISOString(),
    client_unit: data.clientUnit,
    worker_name: data.workerName,
    type: data.type,
    severity: data.severity,
    description: data.description,
    probable_cause: data.probableCause,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('work_accidents')
    .insert(payload);
  if (error) throw error;
}

export async function admitWorkerSupabase(id: string, admissionData: {
  admissionDate: string;
  position: string;
  department: string;
  salary: number;
  contractType: string;
  notes?: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('workers')
    .update({
      contract_status: 'Ativo',
      admission_date: admissionData.admissionDate,
      position: admissionData.position,
      department: admissionData.department,
      base_salary: admissionData.salary,
      contract_type: admissionData.contractType,
      admission_notes: admissionData.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  
  if (error) throw error;
}

export async function terminateWorkerSupabase(workerId: string, terminationData: {
  terminationDate: string;
  terminationReason: string;
  terminationNotes?: string;
  finalFeedback?: string;
}) {
  const supabase = getSupabaseClient();
  
  // Atualizar status do trabalhador
  const { error: workerError } = await supabase
    .from('workers')
    .update({
      contract_status: 'Concluído',
      updated_at: new Date().toISOString(),
    })
    .eq('id', workerId);
  
  if (workerError) throw workerError;
  
  // Tentar criar registro de desligamento (opcional por enquanto)
  try {
    const { error: terminationError } = await supabase
      .from('worker_terminations')
      .insert({
        worker_id: workerId,
        termination_date: terminationData.terminationDate,
        termination_reason: terminationData.terminationReason,
        termination_notes: terminationData.terminationNotes || null,
        final_feedback: terminationData.finalFeedback || null,
        created_at: new Date().toISOString(),
      });
    
    if (terminationError) {
      console.warn('Não foi possível criar registro de desligamento (tabela pode não existir):', terminationError);
    }
  } catch (terminationError) {
    console.warn('Erro ao criar registro de desligamento:', terminationError);
  }
}

export async function createTerminationRequest(workerId: string, workerName: string, terminationData: {
  terminationDate: string;
  terminationReason: string;
  terminationNotes?: string;
  finalFeedback?: string;
}) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('termination_requests')
    .insert({
      worker_id: workerId,
      worker_name: workerName,
      termination_date: terminationData.terminationDate,
      reason: terminationData.terminationReason,
      notes: terminationData.terminationNotes || null,
      final_feedback: terminationData.finalFeedback || null,
      status: 'Pendente',
      request_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPendingTerminationRequests() {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('termination_requests')
    .select('*')
    .eq('status', 'Pendente')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function approveTerminationRequest(requestId: string, approvedBy: string) {
  const supabase = getSupabaseClient();
  
  // Primeiro, obter os dados da solicitação
  const { data: request, error: requestError } = await supabase
    .from('termination_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  if (requestError) throw requestError;
  if (!request) throw new Error('Solicitação não encontrada');
  
  // Atualizar a solicitação para aprovada
  const { error: updateError } = await supabase
    .from('termination_requests')
    .update({
      status: 'Aprovado',
      // Campos approved_* podem não existir no schema atual
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);
  
  if (updateError) throw updateError;
  
  // Executar o desligamento efetivo
  await terminateWorkerSupabase(request.worker_id, {
    terminationDate: request.termination_date,
    terminationReason: request.reason,
    terminationNotes: request.notes,
    finalFeedback: request.final_feedback,
  });
  
  return request;
}

export async function rejectTerminationRequest(requestId: string, rejectionReason: string, rejectedBy: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('termination_requests')
    .update({
      status: 'Rejeitado',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);
  
  if (error) throw error;
}

// Supervision Reports
export async function addSupervisionReportSupabase(data: any) {
  const supabase = getSupabaseClient();
  const payload = {
    supervisor: data?.supervisor,
    report_date: data?.reportDate ? new Date(data.reportDate).toISOString() : new Date().toISOString(),
    client: data?.client,
    activity: data?.activity,
    weather: data?.weather ?? null,
    staff_allocated: data?.staffAllocated,
    staff_absences: data?.staffAbsences,
    staff_normal_hours: data?.staffNormalHours,
    staff_extra_hours: data?.staffExtraHours,
    staff_replacements: data?.staffReplacements ?? null,
    staff_issues: data?.staffIssues ?? null,
    prod_goal: data?.prodGoal ?? null,
    prod_result: data?.prodResult ?? null,
    prod_productive_hours: data?.prodProductiveHours ?? null,
    prod_non_productive_hours: data?.prodNonProductiveHours ?? null,
    prod_justification: data?.prodJustification ?? null,
    safety_epi: data?.safetyEpi,
    safety_briefing: data?.safetyBriefing,
    safety_incidents: data?.safetyIncidents ?? null,
    safety_unsafe_conditions: data?.safetyUnsafeConditions ?? null,
    client_feedback: data?.clientFeedback ?? null,
    client_needs: data?.clientNeeds ?? null,
    pending_issues: data?.pendingIssues ?? null,
    highlights: data?.highlights ?? null,
    recommendations: data?.recommendations ?? null,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from('supervision_reports')
    .insert(payload);
  if (error) throw new Error(error.message || 'Failed to insert supervision report');
}

// Suppliers
export async function addSupplierSupabase(data: any) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('suppliers')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function updateSupplierSupabase(id: string, data: any) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('suppliers')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

// Chart of Accounts
export async function addAccountSupabase(data: {
  code: string;
  name: string;
  class: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('chart_of_accounts')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
    });
  if (error) throw error;
}

// Service Requisitions
export async function addServiceRequisitionSupabase(data: any) {
  const supabase = getSupabaseClient();
  const payload = {
    guide_number: data?.guideNumber ?? null,
    requesting_area: data?.requestingArea ?? null,
    responsible: data?.responsible ?? null,
    request_date: data?.requestDate ? new Date(data.requestDate).toISOString() : new Date().toISOString(),
    reason: data?.reason ?? null,
    main_activities: data?.mainActivities ?? null,
    estimated_time: data?.estimatedTime ?? null,
    estimated_staff: data?.estimatedStaff != null ? Number(data.estimatedStaff) : null,
    budget: data?.budget != null ? Number(data.budget) : null,
    status: data?.status ?? 'Pendente',
    type: data?.type ?? 'Eventual (Requisição)',
    client: data?.client ?? null,
    created_at: new Date().toISOString(),
  };
  const { data: inserted, error } = await supabase
    .from('service_requisitions')
    .insert(payload)
    .select('id')
    .single();
  if (error) {
    // Superficie a mensagem de erro para o caller
    throw new Error(error.message || 'Insert failed (possível RLS ou restrição de schema)');
  }
  return inserted?.id;
}

export async function updateAccountSupabase(id: string, data: Partial<{ code: string; name: string; class: string }>) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('chart_of_accounts')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

// Workers
export async function addWorkerSupabase(data: {
  name: string;
  role: string;
  department: string;
  category?: string;
  baseSalary: number;
  contractStatus: 'Ativo' | 'Suspenso' | 'Concluído';
  type: 'Fixo' | 'Eventual';
}) {
  const supabase = getSupabaseClient();
  const payload = {
    name: data.name,
    role: data.role,
    department: data.department,
    category: data.category || null,
    base_salary: data.baseSalary,
    contract_status: data.contractStatus,
    type: data.type,
    created_at: new Date().toISOString(),
  };
  const { data: inserted, error } = await supabase
    .from('workers')
    .insert(payload)
    .select('id')
    .single();
  if (error) {
    throw new Error(error.message || 'Failed to insert worker');
  }
  return inserted?.id;
}

export async function updateWorkerSupabase(id: string, data: {
  name: string;
  role: string;
  department: string;
  category?: string;
  baseSalary: number;
  contractStatus: 'Ativo' | 'Suspenso' | 'Concluído';
  type: 'Fixo' | 'Eventual';
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('workers')
    .update({
      name: data.name,
      role: data.role,
      department: data.department,
      category: data.category || null,
      base_salary: data.baseSalary,
      contract_status: data.contractStatus,
      type: data.type,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}
