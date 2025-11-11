'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentReference, DocumentData, FirestoreError } from 'firebase/firestore';

export function useDoc<T>(ref: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
            if (snapshot.exists()) {
                setData({ id: snapshot.id, ...snapshot.data() } as T);
            } else {
                setData(null);
            }
            setLoading(false);
            setError(null);
        },
        (err) => {
            console.error(err);
            setError(err);
            setLoading(false);
        }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
