
'use client';

import { useState, useEffect } from 'react';
import { type Worker } from '@/app/dashboard/workers/page';
import { useServices } from './use-services';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface WorkerWithService extends Worker {
  assignedToService?: boolean;
}

export function useWorkers() {
  const { services, loading: servicesLoading } = useServices();
  const [workers, setWorkers] = useState<WorkerWithService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchWorkers() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('workers')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;

        const normalized = (data || []).map((w: any) => ({
          id: w.id,
          name: w.name ?? '',
          role: w.role ?? '',
          department: w.department ?? '',
          category: w.category ?? '',
          baseSalary: Number(w.base_salary ?? w.baseSalary ?? 0),
          contractStatus: (w.status ?? 'Ativo') as Worker['contractStatus'],
          type: (w.type ?? 'Eventual') as Worker['type'],
        })) as WorkerWithService[];

        // Enriquecer com alocação a serviços ativos, se disponível
        if (!servicesLoading && services && services.length > 0) {
          const activeAllocations = new Set<string>();
          services.forEach(service => {
            if (service.status === 'Ativo') {
              service.assignedWorkers?.forEach(worker => {
                if (worker?.id) activeAllocations.add(worker.id);
              });
            }
          });
          normalized.forEach(w => {
            w.assignedToService = activeAllocations.has(w.id);
          });
        }

        if (isMounted) setWorkers(normalized);
      } catch (err) {
        console.error('Erro ao carregar trabalhadores do Supabase', err);
        if (isMounted) setWorkers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchWorkers();
    return () => { isMounted = false; };
  }, [servicesLoading, services]);

  return { workers, loading };
}
