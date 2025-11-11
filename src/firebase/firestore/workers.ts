
'use client';

import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

interface WorkerData {
    name: string;
    role: string;
    department: string;
    category?: string;
    baseSalary: number;
    contractStatus: 'Ativo' | 'Suspenso' | 'Concluído';
}

const workersCollection = 'workers';

export async function addWorker(
  firestore: Firestore,
  workerData: WorkerData
): Promise<string> {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const collectionRef = collection(firestore, workersCollection);
  
  const docRef = await addDoc(collectionRef, {
    ...workerData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateWorker(
    firestore: Firestore,
    workerId: string,
    workerData: Partial<WorkerData>
) {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    
    const docRef = doc(firestore, workersCollection, workerId);
    
    await updateDoc(docRef, {
        ...workerData,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteWorker(
    firestore: Firestore,
    workerId: string
) {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    
    const docRef = doc(firestore, workersCollection, workerId);
    
    await deleteDoc(docRef);
}
