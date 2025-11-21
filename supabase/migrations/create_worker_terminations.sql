-- Criar tabela de desligamentos de trabalhadores
CREATE TABLE IF NOT EXISTS worker_terminations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  termination_date DATE NOT NULL,
  termination_reason VARCHAR(50) NOT NULL,
  termination_notes TEXT,
  final_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar desligamentos por trabalhador
CREATE INDEX IF NOT EXISTS idx_worker_terminations_worker_id ON worker_terminations(worker_id);

-- Índice para buscar desligamentos por data
CREATE INDEX IF NOT EXISTS idx_worker_terminations_date ON worker_terminations(termination_date);

-- RLS (Row Level Security)
ALTER TABLE worker_terminations ENABLE ROW LEVEL SECURITY;

-- Permissões para usuários autenticados
GRANT ALL ON worker_terminations TO authenticated;
GRANT SELECT ON worker_terminations TO anon;