
'use client';

import { useState, useEffect } from 'react';

export interface EpiItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  lowStockThreshold: number;
  expiryDate?: string;
  location?: string;
}

const initialEpis: EpiItem[] = [
    { id: 'epi-1', name: 'Capacete de Segurança', category: 'Proteção de Cabeça', quantity: 45, lowStockThreshold: 10, location: 'Armazém A' },
    { id: 'epi-2', name: 'Óculos de Proteção', category: 'Proteção Ocular', quantity: 8, lowStockThreshold: 15, location: 'Armazém B' },
    { id: 'epi-3', name: 'Máscara PFF2', category: 'Proteção Respiratória', quantity: 0, lowStockThreshold: 50, location: 'Armazém A' },
];


export function useEpiItems() {
  const [epis, setEpis] = useState<EpiItem[]>(initialEpis);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async data fetching
    setTimeout(() => {
      setEpis(initialEpis);
      setLoading(false);
    }, 500);
  }, []);
  
  const updateEpi = (id: string, data: Partial<EpiItem>) => {
    setEpis(prevEpis => prevEpis.map(epi => epi.id === id ? { ...epi, ...data } : epi));
  };
  
  const addEpi = (id: string, data: EpiItem) => {
    setEpis(prevEpis => [...prevEpis, { id, ...data }]);
  };

  return { epis, loading, updateEpi, addEpi };
}
