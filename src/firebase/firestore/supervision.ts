
'use client';

import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

// This should match the structure of your form values
export interface SupervisionReportData {
    supervisor: string;
    reportDate: string;
    client: string;
    activity: string;
    weather?: string;
    staffAllocated: number;
    staffAbsences: number;
    staffNormalHours: number;
    staffExtraHours: number;
    staffReplacements?: string;
    staffIssues?: string;
    prodGoal?: string;
    prodResult?: string;
    prodProductiveHours?: number;
    prodNonProductiveHours?: number;
    prodJustification?: string;
    safetyEpi: 'conforme' | 'nao-conforme';
    safetyBriefing: 'realizado' | 'nao-realizado';
    safetyIncidents?: string;
    safetyUnsafeConditions?: string;
    clientFeedback?: string;
    clientNeeds?: string;
    pendingIssues?: string;
    highlights?: string;
    recommendations?: string;
}

export async function addSupervisionReport(
  firestore: Firestore,
  reportData: SupervisionReportData
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const reportsCollection = collection(firestore, 'supervision-reports');
  
  await addDoc(reportsCollection, {
    ...reportData,
    createdAt: Timestamp.now(),
  });
}
