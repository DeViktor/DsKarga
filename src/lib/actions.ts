
'use server';

import { analyzeCandidateCvFlow } from '@/ai/flows/analyze-candidate-cv';

async function fileToDataURI(file: File) {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mime = file.type || 'application/octet-stream';
  return `data:${mime};base64,${base64}`;
}

export async function analyzeCandidateCv(file: File) {
  const dataUri = await fileToDataURI(file);
  const result = await analyzeCandidateCvFlow({ cv: dataUri });
  return result;
}
