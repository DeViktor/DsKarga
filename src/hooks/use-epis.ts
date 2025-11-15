
'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface EpiItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  lowStockThreshold: number;
  expiryDate?: string;
  location?: string;
}

export function useEpiItems() {
  const [epis, setEpis] = useState<EpiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchEpis() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('epi_items')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const normalized = (data || []).map((e: any) => ({
          id: String(e.id ?? e.uuid ?? e.item_id),
          name: e.name ?? '',
          category: e.category ?? '',
          quantity: Number(e.quantity ?? 0),
          lowStockThreshold: Number(e.low_stock_threshold ?? e.lowStockThreshold ?? 0),
          expiryDate: e.expiry_date ?? e.expiryDate ?? undefined,
          location: e.location ?? undefined,
        })) as EpiItem[];
        if (isMounted) setEpis(normalized);
      } catch (err) {
        console.error('Erro ao carregar EPIs do Supabase', err);
        if (isMounted) setEpis([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchEpis();
    return () => { isMounted = false; };
  }, []);
  
  const updateEpi = async (id: string, data: Partial<EpiItem>) => {
    try {
      const supabase = getSupabaseClient();
      const payload: any = {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        low_stock_threshold: data.lowStockThreshold,
        expiry_date: data.expiryDate,
        location: data.location,
        updated_at: new Date().toISOString(),
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const { error } = await supabase.from('epi_items').update(payload).eq('id', id);
      if (error) throw error;
      setEpis(prev => prev.map(epi => epi.id === id ? { ...epi, ...data } : epi));
    } catch (err) {
      console.error('Erro ao atualizar EPI no Supabase', err);
    }
  };
  
  const addEpi = async (id: string, data: EpiItem) => {
    try {
      const supabase = getSupabaseClient();
      const payload = {
        id,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        low_stock_threshold: data.lowStockThreshold,
        expiry_date: data.expiryDate || null,
        location: data.location || null,
        created_at: new Date().toISOString(),
      };
      const { data: inserted, error } = await supabase.from('epi_items').insert(payload).select().single();
      if (error) throw error;
      const normalized: EpiItem = {
        id: String(inserted?.id ?? id),
        name: inserted?.name ?? data.name,
        category: inserted?.category ?? data.category,
        quantity: Number(inserted?.quantity ?? data.quantity),
        lowStockThreshold: Number(inserted?.low_stock_threshold ?? data.lowStockThreshold),
        expiryDate: inserted?.expiry_date ?? data.expiryDate,
        location: inserted?.location ?? data.location,
      };
      setEpis(prev => [...prev, normalized]);
    } catch (err) {
      console.error('Erro ao adicionar EPI no Supabase', err);
    }
  };

  return { epis, loading, updateEpi, addEpi };
}
