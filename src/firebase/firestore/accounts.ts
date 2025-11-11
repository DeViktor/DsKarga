
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

interface AccountData {
    code: string;
    name: string;
    class: string;
}

const accountsCollection = 'chart-of-accounts';

export async function addAccount(
  firestore: Firestore,
  accountData: AccountData
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const collectionRef = collection(firestore, accountsCollection);
  
  await addDoc(collectionRef, {
    ...accountData,
    createdAt: serverTimestamp(),
  });
}

export async function updateAccount(
    firestore: Firestore,
    accountId: string,
    accountData: Partial<AccountData>
) {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    
    const docRef = doc(firestore, accountsCollection, accountId);
    
    await updateDoc(docRef, {
        ...accountData,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteAccount(
    firestore: Firestore,
    accountId: string
) {
    if (!firestore) {
        throw new Error('Firestore is not initialized');
    }
    
    const docRef = doc(firestore, accountsCollection, accountId);
    
    await deleteDoc(docRef);
}

