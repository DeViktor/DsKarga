
'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Client } from '@/app/dashboard/clients/page';
import { getSupabaseClient } from '@/lib/supabase/client';

export function useClients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchClients() {
            setLoading(true);
            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from('clients')
                    .select('*')
                    .order('name');
                if (error) throw error;
                const normalized = (data || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    nif: c.nif,
                    address: c.address,
                    province: c.province,
                    country: c.country,
                })) as Client[];
                if (isMounted) setClients(normalized);
            } catch (err) {
                console.error('Erro ao carregar clientes do Supabase', err);
                if (isMounted) setClients([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchClients();
        return () => { isMounted = false; };
    }, []);

    const sortedClients = useMemo(() => {
        return [...clients].sort((a, b) => a.name.localeCompare(b.name));
    }, [clients]);

    return { clients: sortedClients, loading };
}
