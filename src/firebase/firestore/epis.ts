'use client';

import {
  Firestore,
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

// --- EPI Delivery ---

interface EpiDeliveryData {
  workerId: string;
  epiId: string;
  quantity: number;
}

export async function registerEpiDelivery(
  firestore: Firestore,
  deliveryData: EpiDeliveryData
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const { workerId, epiId, quantity } = deliveryData;

  const epiRef = doc(firestore, 'epis', epiId);
  // Assuming workers are in a 'workers' collection, adjust if different
  const workerRef = doc(firestore, 'workers', workerId); 
  const deliveriesCollection = collection(firestore, 'epi-deliveries');

  try {
    const epiDoc = await getDoc(epiRef);
    if (!epiDoc.exists()) {
      throw new Error('Equipamento não encontrado!');
    }

    const workerDoc = await getDoc(workerRef);
    if (!workerDoc.exists()) {
      throw new Error("Trabalhador não encontrado!");
    }

    const currentQuantity = epiDoc.data().quantity;
    if (currentQuantity < quantity) {
      throw new Error('Stock insuficiente!');
    }

    await runTransaction(firestore, async (transaction) => {
      const newQuantity = currentQuantity - quantity;
      transaction.update(epiRef, { quantity: newQuantity });
      
      transaction.set(doc(deliveriesCollection), {
          workerId,
          workerName: workerDoc.data().name,
          epiId,
          epiName: epiDoc.data().name,
          quantity,
          date: serverTimestamp(),
          responsible: 'Admin' // Assuming a default responsible user
      });
    });

  } catch (e) {
    console.error('Transaction failed: ', e);
    // As the error is likely a string from our checks, or a Firestore error, we re-throw it.
    if (e instanceof Error) {
        throw e;
    }
    throw new Error('Ocorreu um erro durante a transação.');
  }
}

// --- EPI Items ---

interface EpiItemData {
    name: string;
    category: string;
    quantity: number;
    lowStockThreshold: number;
    expiryDate?: string;
    location?: string;
}

export async function addEpiItem(firestore: Firestore, itemData: EpiItemData) {
    const collectionRef = collection(firestore, 'epis');
    await addDoc(collectionRef, {
        ...itemData,
        createdAt: serverTimestamp(),
    });
}

export async function updateEpiItem(firestore: Firestore, id: string, itemData: Partial<EpiItemData>) {
    const docRef = doc(firestore, 'epis', id);
    await updateDoc(docRef, {
        ...itemData,
        updatedAt: serverTimestamp(),
    });
}

// --- EPI Stock Entry ---

interface EpiStockEntryData {
    epiId: string;
    quantity: number;
    supplier?: string;
    date: Date;
}

export async function addEpiStock(firestore: Firestore, entryData: EpiStockEntryData) {
    const { epiId, quantity } = entryData;
    const epiRef = doc(firestore, 'epis', epiId);

    await runTransaction(firestore, async (transaction) => {
        const epiDoc = await transaction.get(epiRef);
        if (!epiDoc.exists()) {
            throw new Error("Equipamento não encontrado no inventário.");
        }
        const newQuantity = epiDoc.data().quantity + quantity;
        transaction.update(epiRef, { quantity: newQuantity });

        // Optionally, log the stock entry
        const stockLogCollection = collection(firestore, 'epi-stock-entries');
        transaction.set(doc(stockLogCollection), {
            ...entryData,
            createdAt: serverTimestamp()
        });
    });
}


// --- EPI Suppliers ---

interface EpiSupplierData {
    name: string;
    category: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
}

export async function addEpiSupplier(firestore: Firestore, supplierData: EpiSupplierData) {
    const collectionRef = collection(firestore, 'epi-suppliers');
    await addDoc(collectionRef, {
        ...supplierData,
        createdAt: serverTimestamp(),
    });
}

export async function updateEpiSupplier(firestore: Firestore, id: string, supplierData: Partial<EpiSupplierData>) {
    const docRef = doc(firestore, 'epi-suppliers', id);
    await updateDoc(docRef, {
        ...supplierData,
        updatedAt: serverTimestamp(),
    });
}
