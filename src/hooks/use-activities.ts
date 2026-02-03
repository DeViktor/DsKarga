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
    
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limitCount);

      if (error) {
        console.error('Erro ao carregar atividades:', error);
      } else if (data) {
        setActivities(data.map((item: any) => ({
          id: item.id,
          user: item.user,
          userId: item.userId,
          userAvatar: item.userAvatar || item.user_avatar,
          action: item.action,
          target: item.target,
          targetType: item.targetType,
          timestamp: new Date(item.timestamp),
          metadata: item.metadata
        })));
      }
      setLoading(false);
    };

    fetchActivities();
    
    // Simple realtime subscription
    const channel = supabase
      .channel('activities_list_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activities' }, 
        (payload) => {
             fetchActivities(); // Simple re-fetch on change
        }
      )
      .subscribe();
      
    return () => {
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
