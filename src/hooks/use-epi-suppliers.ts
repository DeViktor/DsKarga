
'use client';

import { useState, useEffect } from 'react';

export interface EpiSupplier {
    id: string;
    name: string;
    category: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
}

const initialSuppliers: EpiSupplier[] = [
    { id: 'sup-1', name: 'Fornecedor de EPIs Lda', category: 'Segurança', contactPerson: 'Sr. Manuel', phone: '912345678', email: 'geral@fornecedorepi.com' },
    { id: 'sup-2', name: 'Uniformes & Cia', category: 'Vestuário', contactPerson: 'Dona Ana', phone: '923456789', email: 'comercial@uniformes.co.ao' },
];

export function useEpiSuppliers() {
  const [suppliers, setSuppliers] = useState<EpiSupplier[]>(initialSuppliers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async data fetching
    setTimeout(() => {
        setSuppliers(initialSuppliers);
        setLoading(false);
    }, 500);
  }, []);
  
  const addSupplier = (id: string, data: Omit<EpiSupplier, 'id'>) => {
    setSuppliers(prev => [...prev, { id, ...data }]);
  };
  
  const updateSupplier = (id: string, data: Partial<Omit<EpiSupplier, 'id'>>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  return { suppliers, loading, addSupplier, updateSupplier };
}
