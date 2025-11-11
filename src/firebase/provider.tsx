'use client';

import { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

type FirebaseContextType = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

type FirebaseProviderProps = {
  children: ReactNode;
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

export function FirebaseProvider({ children, app, auth, firestore }: FirebaseProviderProps) {
  const value = { app, auth, firestore };
  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  const context = useFirebase();
  return context.app;
}

export function useFirestore() {
  const context = useFirebase();
  return context.firestore;
}

export function useAuth() {
  const context = useFirebase();
  return context.auth;
}
