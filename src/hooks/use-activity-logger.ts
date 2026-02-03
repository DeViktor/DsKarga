'use client';

import { logActivity as logActivityToSupabase } from '@/hooks/use-activities';
import { useUserProfile } from '@/contexts/user-context';

export function useActivityLogger() {
  const { profile } = useUserProfile();

  const logActivity = async (
    action: string,
    target: string,
    targetType: Parameters<typeof logActivityToSupabase>[5],
    metadata?: { [key: string]: any }
  ) => {
    if (!profile) {
      console.warn('Não foi possível registrar atividade: usuário não disponível');
      return;
    }

    try {
      await logActivityToSupabase(
        profile.id,
        profile.name,
        profile.avatar || profile.name.charAt(0).toUpperCase(),
        action,
        target,
        targetType,
        metadata
      );
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  };

  return { logActivity };
}

// Função utilitária para registrar atividades comuns
export const ActivityActions = {
  CREATE: 'criou',
  UPDATE: 'atualizou',
  DELETE: 'excluiu',
  APPROVE: 'aprovou',
  REJECT: 'rejeitou',
  GENERATE: 'gerou',
  ASSIGN: 'atribuiu',
  REGISTER: 'registrou',
  COMPLETE: 'completou',
  SUSPEND: 'suspendeu',
  ACTIVATE: 'ativou',
} as const;

export const ActivityTargets = {
  WORKER: 'trabalhador',
  SERVICE: 'serviço',
  CLIENT: 'cliente',
  INVOICE: 'fatura',
  PAYMENT: 'pagamento',
  ATTENDANCE: 'assiduidade',
  ACCIDENT: 'acidente',
  EPI: 'EPI',
  PURCHASING: 'compra',
  ACCOUNTING: 'lançamento',
  SUPERVISION: 'supervisão',
  CANDIDATE: 'candidato',
  REPORT: 'relatório',
  CONTRACT: 'contrato',
  USER: 'usuário',
} as const;
