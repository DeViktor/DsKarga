

'use client';

import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  limit,
  orderBy
} from 'firebase/firestore';
import { type RequisitionFormValues } from '@/app/dashboard/services/new/page';


async function getNextGuideNumber(firestore: Firestore): Promise<string> {
    const year = new Date().getFullYear();
    const requisitionsRef = collection(firestore, 'service-requisitions');
    
    const q = query(
        requisitionsRef,
        where('guideNumber', '>=', `GUIA-${year}-0000`),
        where('guideNumber', '<', `GUIA-${year + 1}-0000`),
        orderBy('guideNumber', 'desc'),
        limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return `GUIA-${year}-0001`;
    } else {
        const lastGuideNumber = querySnapshot.docs[0].data().guideNumber;
        const lastSequence = parseInt(lastGuideNumber.split('-')[2], 10);
        const newSequence = lastSequence + 1;
        const newSequencePadded = String(newSequence).padStart(4, '0');
        return `GUIA-${year}-${newSequencePadded}`;
    }
}


export async function addRequisition(
  firestore: Firestore,
  requisitionData: RequisitionFormValues
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const requisitionsCollection = collection(firestore, 'service-requisitions');
  
  let guideNumber = `Contrato-${new Date().getTime()}`;
  let status = 'Ativo';

  if (requisitionData.type === 'Eventual (Requisição)') {
    guideNumber = await getNextGuideNumber(firestore);
    status = 'Pendente';
  }

  await addDoc(requisitionsCollection, {
    ...requisitionData,
    guideNumber,
    requestDate: Timestamp.fromDate(requisitionData.requestDate),
    status,
    createdAt: serverTimestamp(),
  });
}

export function updateRequisitionStatus(
    firestore: Firestore,
    requisitionId: string,
    status: 'Aprovado' | 'Rejeitado'
) {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }

    const requisitionRef = doc(firestore, 'service-requisitions', requisitionId);
    
    // For an eventual service, "Aprovado" means it becomes "Ativo"
    const newStatus = status === 'Aprovado' ? 'Ativo' : 'Rejeitado';

    updateDoc(requisitionRef, { status: newStatus });
}
