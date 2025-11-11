
'use client';

import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { z } from 'zod';

// --- Purchase Request ---

const requestItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number(),
  unit: z.string(),
});

const purchaseRequestSchema = z.object({
  requester: z.string(),
  department: z.string(),
  date: z.date(),
  justification: z.string(),
  items: z.array(requestItemSchema),
});

export type PurchaseRequestItem = z.infer<typeof requestItemSchema>;
export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestSchema>;
export interface PurchaseRequest extends PurchaseRequestFormValues {
    id: string;
    requestNumber: string;
    status: 'Pendente' | 'Aprovado' | 'Rejeitado';
    createdAt: Timestamp;
}

async function getNextRequestNumber(firestore: Firestore): Promise<string> {
    const year = new Date().getFullYear();
    const ref = collection(firestore, 'purchase-requests');
    const q = query(
        ref,
        where('requestNumber', '>=', `PR-${year}-0000`),
        where('requestNumber', '<', `PR-${year + 1}-0000`),
        orderBy('requestNumber', 'desc'),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return `PR-${year}-0001`;
    }
    const lastNumber = snapshot.docs[0].data().requestNumber;
    const lastSequence = parseInt(lastNumber.split('-')[2], 10);
    const newSequence = (lastSequence + 1).toString().padStart(4, '0');
    return `PR-${year}-${newSequence}`;
}

export async function addPurchaseRequest(firestore: Firestore, data: PurchaseRequestFormValues) {
    const requestNumber = await getNextRequestNumber(firestore);
    const collectionRef = collection(firestore, 'purchase-requests');
    await addDoc(collectionRef, {
        ...data,
        requestNumber,
        status: 'Pendente',
        createdAt: serverTimestamp(),
    });
}

export async function updatePurchaseRequestStatus(firestore: Firestore, id: string, status: PurchaseRequest['status']) {
    const docRef = doc(firestore, 'purchase-requests', id);
    await updateDoc(docRef, { status });
}


// --- Purchase Order ---

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    requestNumber: string;
    requestId: string;
    supplierId?: string;
    supplierName?: string;
    status: 'Pendente' | 'Entregue' | 'Cancelado' | 'Atrasado';
    items: PurchaseRequestItem[];
    createdAt: Timestamp;
}

async function getNextOrderNumber(firestore: Firestore): Promise<string> {
    const year = new Date().getFullYear();
    const ref = collection(firestore, 'purchase-orders');
    const q = query(
        ref,
        where('orderNumber', '>=', `PO-${year}-0000`),
        where('orderNumber', '<', `PO-${year + 1}-0000`),
        orderBy('orderNumber', 'desc'),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return `PO-${year}-0001`;
    }
    const lastNumber = snapshot.docs[0].data().orderNumber;
    const lastSequence = parseInt(lastNumber.split('-')[2], 10);
    const newSequence = (lastSequence + 1).toString().padStart(4, '0');
    return `PO-${year}-${newSequence}`;
}

export async function addPurchaseOrder(firestore: Firestore, request: PurchaseRequest) {
    const orderNumber = await getNextOrderNumber(firestore);
    const collectionRef = collection(firestore, 'purchase-orders');
    await addDoc(collectionRef, {
        orderNumber,
        requestNumber: request.requestNumber,
        requestId: request.id,
        items: request.items,
        status: 'Pendente',
        createdAt: serverTimestamp(),
    });
}

export async function updatePurchaseOrderStatus(firestore: Firestore, id: string, status: PurchaseOrder['status']) {
    const docRef = doc(firestore, 'purchase-orders', id);
    await updateDoc(docRef, { status });
}

export async function updatePurchaseOrder(firestore: Firestore, id: string, data: Partial<PurchaseOrder>) {
    const docRef = doc(firestore, 'purchase-orders', id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}


// --- Suppliers ---

export async function addSupplier(firestore: Firestore, data: any) {
    const collectionRef = collection(firestore, 'suppliers');
    await addDoc(collectionRef, {
        ...data,
        createdAt: serverTimestamp(),
    });
}

export async function updateSupplier(firestore: Firestore, id: string, data: any) {
    const docRef = doc(firestore, 'suppliers', id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}
