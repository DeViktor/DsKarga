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
  admissionDate?: string;
  contractType?: string;
  admissionNotes?: string;
  nationality?: string;
  address?: string;
  maritalStatus?: string;
  birthDate?: string;
  email?: string;
  foodAllowance?: number;
  transportAllowance?: number;
  shiftAllowance?: number;
  bonus?: number;
  commission?: number;
  bi?: string;
  nif?: string;
  social_security_number?: string;
  phone?: string;
  gender?: string;
}
