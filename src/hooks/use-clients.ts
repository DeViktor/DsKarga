
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
                    email: c.email ?? undefined,
                    phone: c.phone ?? undefined,
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

        const supabase = getSupabaseClient();
        const channel = supabase
            .channel('clients-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload: any) => {
                setClients(prev => {
                    if (payload.eventType === 'INSERT') {
                        const c = payload.new;
                        return [...prev, {
                            id: c.id,
                            name: c.name,
                            nif: c.nif,
                            address: c.address,
                            province: c.province,
                            country: c.country,
                            email: c.email ?? undefined,
                            phone: c.phone ?? undefined,
                        } as Client];
                    }
                    if (payload.eventType === 'UPDATE') {
                        const c = payload.new;
                        return prev.map(p => p.id === c.id ? {
                            id: c.id,
                            name: c.name,
                            nif: c.nif,
                            address: c.address,
                            province: c.province,
                            country: c.country,
                            email: c.email ?? undefined,
                            phone: c.phone ?? undefined,
                        } as Client : p);
                    }
                    if (payload.eventType === 'DELETE') {
                        const c = payload.old;
                        return prev.filter(p => p.id !== c.id);
                    }
                    return prev;
                });
            })
            .subscribe();

        return () => { 
            isMounted = false; 
            try { supabase.removeChannel(channel); } catch {}
        };
    }, []);

    const sortedClients = useMemo(() => {
        return [...clients].sort((a, b) => a.name.localeCompare(b.name));
    }, [clients]);

    return { clients: sortedClients, loading };
}
