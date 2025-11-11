'use client';

import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface CandidateData {
  name: string;
  role?: string;
  email?: string;
  phoneNumber?: string;
  seniority?: string;
  gender?: string;
  age?: number;
  areaOfSpecialization?: string;
  yearsOfExperience?: number;
  course?: string;
  skills?: string;
  qualifications?: string;
  languages?: string;
  previousCompanies?: string;
  certifications?: string;
  experienceSummary?: string;
}

export function addCandidate(
  firestore: Firestore,
  candidateData: CandidateData
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const candidatesCollection = collection(firestore, 'candidates');
  addDoc(candidatesCollection, {
    ...candidateData,
    status: 'Pendente', // Default status
    createdAt: serverTimestamp(),
  });
}
