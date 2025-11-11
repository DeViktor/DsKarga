

export type Candidate = {
    id: string;
    name: string;
    role: string;
    areaOfSpecialization?: string;
    yearsOfExperience?: number;
    phoneNumber?: string;
    age?: number;
  };

  export const candidates: Candidate[] = [
    { id: 'CAND-001', name: 'Ana Silva', role: 'Desenvolvedora Frontend', areaOfSpecialization: 'Tecnologia', yearsOfExperience: 5, phoneNumber: '11 99999-1111', age: 28 },
    { id: 'CAND-002', name: 'Bruno Costa', role: 'Designer UX/UI', areaOfSpecialization: 'Design', yearsOfExperience: 3, phoneNumber: '21 99999-2222', age: 25 },
    { id: 'CAND-003', name: 'Carla Dias', role: 'Gerente de Projetos', areaOfSpecialization: 'Gerenciamento', yearsOfExperience: 8, phoneNumber: '31 99999-3333', age: 35 },
    { id: 'CAND-004', name: 'Daniel Souza', role: 'Engenheiro de Dados', areaOfSpecialization: 'Dados', yearsOfExperience: 4, phoneNumber: '41 99999-4444', age: 30 },
    { id: 'CAND-005', name: 'Alice Moreira', role: 'Desenvolvedor Full Stack', areaOfSpecialization: 'N/A', yearsOfExperience: undefined, phoneNumber: 'N/A', age: undefined },
    { id: 'CAND-006', name: 'Bruno Dias', role: 'Engenheira de Frontend', areaOfSpecialization: 'N/A', yearsOfExperience: undefined, phoneNumber: 'N/A', age: undefined },
    { id: 'CAND-007', name: 'Carla Faria', role: 'Desenvolvedor Backend', areaOfSpecialization: 'N/A', yearsOfExperience: undefined, phoneNumber: 'N/A', age: undefined },
    { id: 'CAND-008', name: 'Diego Vaz', role: 'Desenvolvedora React Native', areaOfSpecialization: 'N/A', yearsOfExperience: undefined, phoneNumber: 'N/A', age: undefined },
    { id: 'CAND-009', name: 'Elisa Pinto', role: 'Designer UX/UI', areaOfSpecialization: 'N/A', yearsOfExperience: undefined, phoneNumber: 'N/A', age: undefined },
    { id: 'CAND-010', name: 'Fábio Neves', role: 'Analista de Dados', areaOfSpecialization: 'N/A', yearsOfExperience: undefined, phoneNumber: 'N/A', age: undefined },
    { id: 'CAND-011', name: 'Gustavo Lima', role: 'Engenheiro de Software', areaOfSpecialization: 'N/A', yearsOfExperience: undefined, phoneNumber: 'N/A', age: undefined },
    { id: 'CAND-012', name: 'Helena Costa', role: 'Analista de Dados', areaOfSpecialization: 'N/A', yearsOfExperience: undefined, phoneNumber: 'N/A', age: undefined },
  ];

export type Worker = {
  id: string;
  name: string;
  department: string;
  role: string;
  contractStatus: 'Ativo' | 'Suspenso' | 'Concluído';
  baseSalary: number;
  category?: string;
  type: 'Fixo' | 'Eventual';
};

export const workers: Worker[] = [
  { id: 'WRK-001', name: 'Fábio Gomes', department: 'Logística', role: 'Estivador', contractStatus: 'Ativo', baseSalary: 150000, category: 'Mão de Obra I', type: 'Eventual' },
  { id: 'WRK-002', name: 'Helena Pinto', department: 'Administração', role: 'Assistente', contractStatus: 'Ativo', baseSalary: 180000, category: 'Admin I', type: 'Fixo' },
  { id: 'WRK-003', name: 'Igor Santos', department: 'Logística', role: 'Operador de Empilhadeira', contractStatus: 'Suspenso', baseSalary: 160000, category: 'Operador Máquinas', type: 'Eventual' },
  { id: 'WRK-004', name: 'Joana Almeida', department: 'Armazém', role: 'Separador', contractStatus: 'Ativo', baseSalary: 140000, category: 'Mão de Obra II', type: 'Fixo' },
  { id: 'WRK-005', name: 'Luís Pereira', department: 'Logística', role: 'Estivador', contractStatus: 'Concluído', baseSalary: 150000, category: 'Mão de Obra I', type: 'Eventual' },
  { id: 'CAND-001', name: 'Ana Silva', department: 'Tecnologia', role: 'Desenvolvedora Frontend', contractStatus: 'Ativo', baseSalary: 250000, category: 'Técnico Superior', type: 'Fixo' },
  { id: 'CAND-002', name: 'Bruno Costa', department: 'Design', role: 'Designer UX/UI', contractStatus: 'Ativo', baseSalary: 200000, category: 'Técnico Médio', type: 'Fixo' },
];

export type TerminationRequest = {
  id: string;
  workerId: string;
  workerName: string;
  requestDate: string;
  reason: string;
  status: 'Pendente';
};

export const terminationRequests: TerminationRequest[] = [
    { id: 'TERM-001', workerId: 'WRK-003', workerName: 'Igor Santos', requestDate: '2024-07-30', reason: 'Fim de Contrato a Termo', status: 'Pendente' },
];


export type Service = {
  id: string;
  client: string;
  type: 'Contrato Fixo' | 'Eventual (Requisição)';
  status: 'Ativo' | 'Concluído' | 'Suspenso';
  startDate: string;
  endDate?: string;
  workerCount: number;
  budget?: number;
  progress: number;
  allocatedWorkers?: { id: string, name: string }[];
};

export const services: Service[] = [
  { id: 'SRV-001', client: 'Cliente A', type: 'Contrato Fixo', status: 'Ativo', startDate: '2024-06-01', endDate: '2024-12-31', workerCount: 12, budget: 12000000, progress: 30, allocatedWorkers: [{id: 'WRK-001', name: 'Fábio Gomes'}, {id: 'WRK-003', name: 'Igor Santos'}] },
  { id: 'SRV-002', client: 'Cliente B', type: 'Eventual (Requisição)', status: 'Concluído', startDate: '2024-05-20', endDate: '2024-06-20', workerCount: 8, budget: 2500000, progress: 100, allocatedWorkers: [{id: 'WRK-002', name: 'Helena Pinto'}] },
  { id: 'SRV-003', client: 'Cliente C', type: 'Contrato Fixo', status: 'Suspenso', startDate: '2023-11-10', endDate: '2024-11-09', workerCount: 5, budget: 7500000, progress: 65 },
  { id: 'SRV-004-ID', client: 'Cliente D', type: 'Eventual (Requisição)', status: 'Ativo', startDate: '2024-07-15', endDate: '2024-07-25', workerCount: 15, budget: 1800000, progress: 75, allocatedWorkers: [{id: 'WRK-004', name: 'Joana Almeida'}, {id: 'WRK-005', name: 'Luís Pereira'}] },
];


export type RecentActivity = {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
};

export const recentActivities: RecentActivity[] = [
    { id: '1', user: 'Supervisor A', avatar: 'SA', action: 'registou a assiduidade para', target: 'equipa de Logística', time: 'há 5 minutos' },
    { id: '2', user: 'Admin', avatar: 'AD', action: 'atualizou a taxa de faturação', target: '', time: 'há 1 hora' },
    { id: '3', user: 'Gerente de RH', avatar: 'RH', action: 'adicionou novo candidato', target: 'Carla Dias', time: 'há 3 horas' },
    { id: '4', user: 'Supervisor B', avatar: 'SB', action: 'gerou fatura para', target: 'Cliente A', time: 'há 1 dia' },
];
