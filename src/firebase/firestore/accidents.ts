
'use client';

import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

export interface AccidentData {
    datetime: string;
    clientUnit: string;
    workerName: string;
    type: 'sem-baixa' | 'com-baixa' | 'quase-acidente';
    severity: 'leve' | 'moderado' | 'grave';
    description: string;
    probableCause: string;
}

export async function addAccidentReport(
  firestore: Firestore,
  accidentData: AccidentData
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const accidentsCollection = collection(firestore, 'work-accidents');
  
  // Convert the string datetime to a Firebase Timestamp
  const date = new Date(accidentData.datetime);
  const timestamp = Timestamp.fromDate(date);

  await addDoc(accidentsCollection, {
    ...accidentData,
    datetime: timestamp,
  });
}
