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
             console.warn('Tabela activities não encontrada. Ignorando erro.');
             if (isMounted) setActivities([]);
             return;
           }
           throw error;
        } 
        
        if (data && isMounted) {
          setActivities(data.map((item: any) => ({
            id: item.id,
            user: item.user_name || item.user || 'Sistema',
            userId: item.user_id || item.userId,
            userAvatar: item.user_avatar || item.userAvatar,
            action: item.action,
            target: item.target,
            targetType: item.target_type || item.targetType,
            timestamp: new Date(item.created_at || item.timestamp || new Date()),
            metadata: item.metadata
          })));
        }
      } catch (err) {
        console.error('Erro ao carregar atividades:', err);
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
      user: userName,
      userId,
      userAvatar,
      action,
      target,
      targetType,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
  }
}
