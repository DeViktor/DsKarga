'use client';

import { useState, useEffect, ReactNode } from 'react';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

import { FirebaseProvider } from '@/firebase/provider';
import { firebaseConfig } from './config';

type FirebaseClientProviderProps = {
  children: ReactNode;
};

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    let app: FirebaseApp;
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    // Set up auth state listener to manage the auth token cookie
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          // Set the authentication token in cookies with 24 hour expiration
          document.cookie = `firebase-auth-token=${token}; path=/; max-age=86400; SameSite=Strict`;
        } catch (error) {
          console.error('Erro ao obter token de autenticação:', error);
          // Clear the cookie if there's an error
          document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
        }
      } else {
        // Clear the cookie when user is not authenticated
        document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      }
    });

    setFirebase({ app, auth, firestore });

    // Cleanup the auth state listener
    return () => unsubscribe();
  }, []);

  if (!firebase) {
    // Pode mostrar um loader aqui se quiser
    return null;
  }

  return (
    <FirebaseProvider
      app={firebase.app}
      auth={firebase.auth}
      firestore={firebase.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
