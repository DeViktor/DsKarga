'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export type ActivityType = {
  id: string;
  user: string;
  userId: string;
  userAvatar: string;
  action: string;
  target: string;
  targetType: 'worker' | 'service' | 'client' | 'invoice' | 'payment' | 'attendance' | 'accident' | 'epi' | 'purchasing' | 'accounting' | 'supervision' | 'candidate';
  timestamp: Date;
  metadata?: {
    [key: string]: any;
  };
};

export function useRecentActivities(limitCount: number = 10) {
  const firestore = useFirestore();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const activitiesRef = collection(firestore, 'activities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesData: ActivityType[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        activitiesData.push({
          id: doc.id,
          user: data.user,
          userId: data.userId,
          userAvatar: data.userAvatar,
          action: data.action,
          target: data.target,
          targetType: data.targetType,
          timestamp: data.timestamp?.toDate() || new Date(),
          metadata: data.metadata || {},
        });
      });
      setActivities(activitiesData);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar atividades:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, limitCount]);

  return { activities, loading };
}

export async function logActivity(
  firestore: any,
  userId: string,
  userName: string,
  userAvatar: string,
  action: string,
  target: string,
  targetType: ActivityType['targetType'],
  metadata?: { [key: string]: any }
) {
  try {
    const activitiesRef = collection(firestore, 'activities');
    await addDoc(activitiesRef, {
      user: userName,
      userId,
      userAvatar,
      action,
      target,
      targetType,
      timestamp: serverTimestamp(),
      metadata: metadata || {},
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
  }
}