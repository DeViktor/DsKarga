export interface Worker {
  id: string;
  name: string;
  role: string;
  department: string;
  category?: string;
  baseSalary: number;
  contractStatus: 'Ativo' | 'Suspenso' | 'Concluído';
  type: 'Fixo' | 'Eventual';
  photoUrl?: string;
}
