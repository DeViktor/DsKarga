'use client';

import { useState, useEffect, ReactNode } from 'react';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
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

    setFirebase({ app, auth, firestore });
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
