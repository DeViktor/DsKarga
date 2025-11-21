'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useAuth } from '@/firebase/provider';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
};

type UserContextType = {
  profile: UserProfile | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setProfile(null);
      setLoading(authLoading);
      return;
    }

    // Try to get user profile from Firestore
    const userRef = doc(firestore, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfile({
          id: user.uid,
          name: data.name || user.displayName || 'Usuário',
          email: user.email || '',
          role: data.role || 'Usuário',
          avatar: data.avatar || user.photoURL || undefined,
          department: data.department || undefined,
        });
      } else {
        // Create a basic profile if no Firestore document exists
        setProfile({
          id: user.uid,
          name: user.displayName || 'Usuário',
          email: user.email || '',
          role: 'Usuário',
          avatar: user.photoURL || undefined,
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar perfil do usuário:', error);
      // Fallback to basic profile
      setProfile({
        id: user.uid,
        name: user.displayName || 'Usuário',
        email: user.email || '',
        role: 'Usuário',
        avatar: user.photoURL || undefined,
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore, authLoading]);

  return (
    <UserContext.Provider value={{ profile, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProvider');
  }
  return context;
}