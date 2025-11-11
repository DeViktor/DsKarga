
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { type Worker } from '@/app/dashboard/workers/page';
import { useServices, type Service } from './use-services';
import { workers as staticWorkers } from '@/lib/data';

export interface WorkerWithService extends Worker {
  assignedToService?: boolean;
}

// THIS IS A MOCK HOOK. IT RETURNS STATIC DATA.
export function useWorkers() {
    const { services, loading: servicesLoading } = useServices();
    const [workers, setWorkers] = useState<WorkerWithService[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching
        setLoading(true);
        
        // Start with static data
        let baseWorkers = staticWorkers;
        
        // Enhance with service data if available
        if (!servicesLoading && services) {
            const activeAllocations = new Set<string>();
            services.forEach(service => {
                if (service.status === 'Ativo') {
                    service.assignedWorkers?.forEach(worker => {
                        activeAllocations.add(worker.id);
                    });
                }
            });

            baseWorkers = baseWorkers.map(worker => ({
                ...worker,
                assignedToService: activeAllocations.has(worker.id),
            }));
        }
        
        setWorkers(baseWorkers as WorkerWithService[]);
        setLoading(false);

    }, [services, servicesLoading]);
    
    return { workers, loading };
}
