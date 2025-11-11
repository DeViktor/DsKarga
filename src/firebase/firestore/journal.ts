
'use client';

import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { z } from 'zod';

const entryLineSchema = z.object({
    accountId: z.string().min(1, 'Conta é obrigatória'),
    accountName: z.string().optional(),
    debit: z.coerce.number().min(0).default(0),
    credit: z.coerce.number().min(0).default(0),
});

export const journalEntrySchema = z.object({
    date: z.date({ required_error: 'A data é obrigatória.' }),
    documentRef: z.string().optional(),
    description: z.string().min(1, 'Descrição é obrigatória.'),
    lines: z.array(entryLineSchema).min(2, 'São necessárias pelo menos duas linhas.'),
}).superRefine((data, ctx) => {
    const totalDebit = data.lines.reduce((acc, line) => acc + line.debit, 0);
    const totalCredit = data.lines.reduce((acc, line) => acc + line.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) { // Use tolerance for float comparison
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'O total de débitos e créditos deve ser igual.',
            path: ['lines'],
        });
    }
});

export type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;

export async function addJournalEntry(
  firestore: Firestore,
  entryData: JournalEntryFormValues
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }

  const entriesCollection = collection(firestore, 'journal-entries');
  
  await addDoc(entriesCollection, {
    ...entryData,
    date: Timestamp.fromDate(entryData.date),
    createdAt: serverTimestamp(),
  });
}
