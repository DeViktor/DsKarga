
'use server';

import { analyzeCandidateCvFlow } from '@/ai/flows/analyze-candidate-cv';

function fileToDataURI(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to read file as Data URI.'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

export async function analyzeCandidateCv(file: File) {
  const dataUri = await fileToDataURI(file);
  
  const result = await analyzeCandidateCvFlow({ cv: dataUri });
  return result;
}
