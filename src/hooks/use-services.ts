
'use client';

import { useMemo } from 'react';
import { useCollection } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';

export interface Service {
  id: string;
  guideNumber: string;
  requestingArea: string;
  responsible: string;
  requestDate: Timestamp;
  reason: string;
  mainActivities: string;
  estimatedTime: string;
  estimatedStaff: number;
  budget?: number;
  assignedWorkers?: { id: string; name: string }[];
  status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Ativo' | 'Concluído' | 'Suspenso';
  createdAt: Timestamp;
  type: 'Contrato Fixo' | 'Eventual (Requisição)';
  client: string;
}

export function useServices() {
  const firestore = useFirestore();

  const servicesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'service-requisitions'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: services, loading, error } = useCollection<Service>(servicesQuery);

  return { services, loading, error };
}
