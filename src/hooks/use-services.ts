
"use client";

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface Service {
  id: string;
  guideNumber: string;
  requestingArea: string;
  responsible: string;
  requestDate: Date;
  reason: string;
  mainActivities: string;
  estimatedTime: string;
  estimatedStaff: number;
  budget?: number;
  assignedWorkers?: { id: string; name: string }[];
  status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Ativo' | 'Concluído' | 'Suspenso';
  createdAt: Date;
  type: 'Contrato Fixo' | 'Eventual (Requisição)';
  client: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchServices() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('service_requisitions')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const normalized = (data || []).map((s: any) => ({
          id: s.id,
          guideNumber: s.guide_number ?? s.guideNumber ?? '',
          requestingArea: s.requesting_area ?? s.requestingArea ?? '',
          responsible: s.responsible ?? '',
          requestDate: s.request_date ? new Date(s.request_date) : new Date(),
          reason: s.reason ?? '',
          mainActivities: s.main_activities ?? s.mainActivities ?? '',
          estimatedTime: s.estimated_time ?? s.estimatedTime ?? '',
          estimatedStaff: Number(s.estimated_staff ?? s.estimatedStaff ?? 0),
          budget: s.budget != null ? Number(s.budget) : undefined,
          assignedWorkers: Array.isArray(s.assigned_workers) ? s.assigned_workers : [],
          status: (s.status ?? 'Pendente') as Service['status'],
          createdAt: s.created_at ? new Date(s.created_at) : new Date(),
          type: (s.type ?? 'Eventual (Requisição)') as Service['type'],
          client: s.client ?? '',
        })) as Service[];
        if (isMounted) {
          setServices(normalized);
          setError(null);
        }
      } catch (err: any) {
        console.error('Erro ao carregar serviços do Supabase', err);
        if (isMounted) {
          setServices([]);
          setError(err?.message ?? 'Falha ao carregar serviços');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchServices();
    return () => { isMounted = false; };
  }, []);

  return { services: services ?? [], loading, error };
}
