
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

interface ClientData {
    name: string;
    nif: string;
    address: string;
    province: string;
    country: string;
    email?: string;
    phone?: string;
}

const clientsCollection = 'clients';

export async function addClient(
  firestore: Firestore,
  clientData: ClientData
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const collectionRef = collection(firestore, clientsCollection);
  
  await addDoc(collectionRef, {
    ...clientData,
    createdAt: serverTimestamp(),
  });
}

export async function updateClient(
    firestore: Firestore,
    clientId: string,
    clientData: Partial<ClientData>
) {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    
    const docRef = doc(firestore, clientsCollection, clientId);
    
    await updateDoc(docRef, {
        ...clientData,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteClient(
    firestore: Firestore,
    clientId: string
) {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    
    const docRef = doc(firestore, clientsCollection, clientId);
    
    await deleteDoc(docRef);
}
