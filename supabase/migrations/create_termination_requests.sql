-- Criar tabela de solicitações de desligamento
CREATE TABLE IF NOT EXISTS termination_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  worker_name VARCHAR(255) NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date DATE NOT NULL,
  reason VARCHAR(100) NOT NULL,
  notes TEXT,
  final_feedback TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Rejeitado')),
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_termination_requests_worker_id ON termination_requests(worker_id);
CREATE INDEX IF NOT EXISTS idx_termination_requests_status ON termination_requests(status);
CREATE INDEX IF NOT EXISTS idx_termination_requests_request_date ON termination_requests(request_date);

-- RLS (Row Level Security)
ALTER TABLE termination_requests ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Usuários autenticados podem ver todas as solicitações
CREATE POLICY "Usuários autenticados podem ver solicitações" ON termination_requests
  FOR SELECT TO authenticated USING (true);

-- Usuários autenticados podem criar solicitações
CREATE POLICY "Usuários autenticados podem criar solicitações" ON termination_requests
  FOR INSERT TO authenticated WITH CHECK (true);

-- Usuários autenticados podem atualizar solicitações (para aprovação)
CREATE POLICY "Usuários autenticados podem atualizar solicitações" ON termination_requests
  FOR UPDATE TO authenticated USING (true);

-- Permissões
GRANT ALL ON termination_requests TO authenticated;
GRANT SELECT ON termination_requests TO anon;