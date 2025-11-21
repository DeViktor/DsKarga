'use client';

import { logActivity as logActivityToFirebase } from '@/hooks/use-activities';
import { useUserProfile } from '@/contexts/user-context';
import { useFirestore } from '@/firebase/provider';

export function useActivityLogger() {
  const { profile } = useUserProfile();
  const firestore = useFirestore();

  const logActivity = async (
    action: string,
    target: string,
    targetType: Parameters<typeof logActivityToFirebase>[5],
    metadata?: { [key: string]: any }
  ) => {
    if (!profile || !firestore) {
      console.warn('Não foi possível registrar atividade: usuário ou Firestore não disponível');
      return;
    }

    try {
      await logActivityToFirebase(
        firestore,
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