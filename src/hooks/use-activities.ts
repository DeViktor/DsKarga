'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export type ActivityType = {
  id: string;
  user: string;
  userId: string;
  userAvatar: string;
  action: string;
  target: string;
  targetType: string;
  timestamp: Date;
  metadata?: {
    [key: string]: any;
  };
};

export function useRecentActivities(limitCount: number = 10) {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;
    
    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false }) // Use created_at instead of timestamp if timestamp doesn't exist
          .limit(limitCount);

        if (error) {
           // Check if error is because table doesn't exist
           if (error.code === '42P01') {
             console.warn('Tabela activities não encontrada. Criando tabela...');
             console.log('Detalhes do erro:', {
               code: error.code,
               message: error.message,
               details: error.details,
               hint: error.hint,
             });
             if (isMounted) setActivities([]);
             return;
           }
           console.error('Erro ao buscar atividades:', {
             code: error.code,
             message: error.message,
             details: error.details,
             hint: error.hint,
           });
           throw error;
        } 
        
        if (data && isMounted) {
          setActivities(data.map((item: any) => ({
            id: item.id,
            user: item.user_name || 'Sistema',
            userId: item.user_id,
            userAvatar: item.user_avatar,
            action: item.action,
            target: item.target,
            targetType: item.target_type,
            timestamp: new Date(item.created_at),
            metadata: item.metadata
          })));
        }
      } catch (err) {
        console.error('Erro ao carregar atividades:', {
          error: err,
          message: err instanceof Error ? err.message : 'Erro desconhecido',
          code: (err as any)?.code,
          details: (err as any)?.details,
          hint: (err as any)?.hint,
        });
        if (isMounted) setActivities([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchActivities();
    
    // Simple realtime subscription
    const channel = supabase
      .channel('activities_list_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activities' }, 
        () => {
             fetchActivities(); // Simple re-fetch on change
        }
      )
      .subscribe();
      
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [limitCount]);

  return { activities, loading };
}

export async function logActivity(
  userId: string,
  userName: string,
  userAvatar: string,
  action: string,
  target: string,
  targetType: string,
  metadata?: { [key: string]: any }
) {
  const supabase = getSupabaseClient();
  try {
    const { error } = await supabase.from('activities').insert({
      user_name: userName,
      user_id: userId,
      user_avatar: userAvatar,
      action,
      target,
      target_type: targetType,
      metadata: metadata || {},
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Erro ao registrar atividade:', {
      error: error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      code: (error as any)?.code,
      details: (error as any)?.details,
    });
  }
}
