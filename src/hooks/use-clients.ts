
'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { type Client } from '@/app/dashboard/clients/page';

const mockClients: Client[] = [
    { id: 'client-1', name: 'Cliente A (Exemplo)', nif: '5000123456', address: 'Cazenga', province: 'Luanda', country: 'Angola' },
    { id: 'client-2', name: 'Cliente B (Exemplo)', nif: '5000234567', address: 'Viana', province: 'Luanda', country: 'Angola' },
    { id: 'client-3', name: 'Cliente C (Exemplo)', nif: '5000345678', address: 'Cacuaco', province: 'Luanda', country: 'Angola' },
    { id: 'client-4', name: 'Cliente D (Exemplo)', nif: '5000456789', address: 'Talatona', province: 'Luanda', country: 'Angola' },
    { id: 'client-5', name: 'Cliente E (Exemplo)', nif: '5000567890', address: 'Belas', province: 'Luanda', country: 'Angola' },
];

export function useClients() {
    const firestore = useFirestore();

    const clientsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'clients'), orderBy('name'));
    }, [firestore]);

    const { data: firestoreClients, loading } = useCollection<Client>(clientsQuery);
    
    const allClients = useMemo(() => {
        const combined = [...mockClients, ...(firestoreClients || [])];
        const unique = Array.from(new Map(combined.map(item => [item.name, item])).values());
        return unique.sort((a,b) => a.name.localeCompare(b.name));
    }, [firestoreClients]);

    return { clients: allClients, loading };
}
