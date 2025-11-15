
'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

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
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchCandidates() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const normalized = (data || []).map((c: any) => ({
          id: String(c.id),
          name: c.name ?? '',
          role: c.role ?? undefined,
          email: c.email ?? undefined,
          phoneNumber: c.phone_number ?? c.phoneNumber ?? undefined,
          seniority: c.seniority ?? undefined,
          gender: c.gender ?? undefined,
          age: typeof c.age === 'number' ? c.age : undefined,
          areaOfSpecialization: c.area_of_specialization ?? c.areaOfSpecialization ?? undefined,
          yearsOfExperience: typeof c.years_of_experience === 'number' ? c.years_of_experience : c.yearsOfExperience ?? undefined,
          course: c.course ?? undefined,
          skills: c.skills ?? undefined,
          qualifications: c.qualifications ?? undefined,
          languages: c.languages ?? undefined,
          previousCompanies: c.previous_companies ?? c.previousCompanies ?? undefined,
          certifications: c.certifications ?? undefined,
          experienceSummary: c.experience_summary ?? c.experienceSummary ?? undefined,
          status: c.status ?? 'Pendente',
          createdAt: c.created_at ?? undefined,
        })) as Candidate[];
        if (isMounted) setCandidates(normalized);
      } catch (err) {
        console.error('Erro ao carregar candidatos do Supabase', err);
        if (isMounted) setCandidates([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCandidates();
    return () => { isMounted = false; };
  }, []);

  return { candidates, loading };
}
