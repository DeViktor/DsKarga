
'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface EpiSupplier {
    id: string;
    name: string;
    category: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
}

export function useEpiSuppliers() {
  const [suppliers, setSuppliers] = useState<EpiSupplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchSuppliers() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('epi_suppliers')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const normalized = (data || []).map((s: any) => ({
          id: String(s.id ?? s.uuid),
          name: s.name ?? '',
          category: s.category ?? '',
          contactPerson: s.contact_person ?? s.contactPerson ?? undefined,
          phone: s.phone ?? undefined,
          email: s.email ?? undefined,
        })) as EpiSupplier[];
        if (isMounted) setSuppliers(normalized);
      } catch (err) {
        console.error('Erro ao carregar fornecedores de EPI do Supabase', err);
        if (isMounted) setSuppliers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSuppliers();
    return () => { isMounted = false; };
  }, []);
  
  const addSupplier = async (id: string, data: Omit<EpiSupplier, 'id'>) => {
    try {
      const supabase = getSupabaseClient();
      const payload = {
        id,
        name: data.name,
        category: data.category,
        contact_person: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        created_at: new Date().toISOString(),
      };
      const { data: inserted, error } = await supabase.from('epi_suppliers').insert(payload).select().single();
      if (error) throw error;
      const normalized: EpiSupplier = {
        id: String(inserted?.id ?? id),
        name: inserted?.name ?? data.name,
        category: inserted?.category ?? data.category,
        contactPerson: inserted?.contact_person ?? data.contactPerson,
        phone: inserted?.phone ?? data.phone,
        email: inserted?.email ?? data.email,
      };
      setSuppliers(prev => [...prev, normalized]);
    } catch (err) {
      console.error('Erro ao adicionar fornecedor no Supabase', err);
    }
  };
  
  const updateSupplier = async (id: string, data: Partial<Omit<EpiSupplier, 'id'>>) => {
    try {
      const supabase = getSupabaseClient();
      const payload: any = {
        name: data.name,
        category: data.category,
        contact_person: data.contactPerson,
        phone: data.phone,
        email: data.email,
        updated_at: new Date().toISOString(),
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const { error } = await supabase.from('epi_suppliers').update(payload).eq('id', id);
      if (error) throw error;
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } as EpiSupplier : s));
    } catch (err) {
      console.error('Erro ao atualizar fornecedor no Supabase', err);
    }
  };

  return { suppliers, loading, addSupplier, updateSupplier };
}
