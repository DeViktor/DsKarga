
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData, orderBy, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { candidates as staticCandidates } from '@/lib/data';

export interface Candidate {
  id: string;
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
  status?: 'Pendente' | 'Em entrevista' | 'Contratado' | 'Rejeitado';
  createdAt?: any;
}

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(staticCandidates);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // This is now a mock hook that uses static data.
    // In a real app, you would fetch from Firestore here.
    setLoading(false);
  }, []);

  return { candidates, loading };
}
