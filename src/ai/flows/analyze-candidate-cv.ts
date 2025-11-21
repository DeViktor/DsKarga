// Removed 'use server' because this file exports non-async values (schemas/objects).

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const AnalyzeCandidateCvInputSchema = z.object({
  cv: z.string().describe("A CV file as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

export type AnalyzeCandidateCvInput = z.infer<typeof AnalyzeCandidateCvInputSchema>;

export const AnalyzeCandidateCvOutputSchema = z.object({
  name: z.string().describe('Nome completo do candidato.'),
  email: z.string().optional().describe('Endereço de email do candidato.'),
  phoneNumber: z.string().optional().describe('Número de telefone de contato.'),
  age: z.number().optional().describe('Idade do candidato.'),
  role: z.string().optional().describe('O cargo ou função principal do candidato.'),
  seniority: z.string().optional().describe('Nível de senioridade (Júnior, Pleno, Sênior, Especialista).'),
  areaOfSpecialization: z.string().optional().describe('A principal área de especialização ou indústria.'),
  yearsOfExperience: z.number().optional().describe('Total de anos de experiência profissional.'),
  experienceSummary: z.string().optional().describe('Um resumo conciso da carreira e experiência do candidato.'),
  course: z.string().optional().describe('O curso ou formação académica principal.'),
  qualifications: z.string().optional().describe('Outras qualificações académicas ou técnicas relevantes.'),
  skills: z.string().optional().describe('Lista de competências técnicas e comportamentais, separadas por vírgula.'),
  languages: z.string().optional().describe('Idiomas que o candidato fala e o seu nível de proficiência.'),
  previousCompanies: z.string().optional().describe('Lista das empresas anteriores onde o candidato trabalhou.'),
  certifications: z.string().optional().describe('Lista de certificações profissionais relevantes.'),
});

export type AnalyzeCandidateCvOutput = z.infer<typeof AnalyzeCandidateCvOutputSchema>;

const cvAnalysisPrompt = ai.definePrompt({
  name: 'cvAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AnalyzeCandidateCvInputSchema },
  output: { schema: AnalyzeCandidateCvOutputSchema },
  prompt: `
    Analise o seguinte CV e extraia as informações de acordo com o esquema de saída.

    Seja extremamente rigoroso e extraia os seguintes dados:
    - Dados Pessoais: Nome completo, email, telefone e idade.
    - Perfil Profissional: O cargo atual ou mais recente, o nível de senioridade (Júnior, Pleno, Sênior, etc.) e a sua área de especialização (ex: Logística, Finanças, TI).
    - Experiência: O número total de anos de experiência profissional e um resumo conciso da sua carreira.
    - Educação: O principal curso ou formação académica e outras qualificações relevantes.
    - Competências: Uma lista de competências técnicas e soft skills, idiomas falados, empresas onde já trabalhou e certificações que possui.

    CV para análise:
    {{media url=cv}}
  `,
});

export const analyzeCandidateCvFlow = ai.defineFlow(
  {
    name: 'analyzeCandidateCvFlow',
    inputSchema: AnalyzeCandidateCvInputSchema,
    outputSchema: AnalyzeCandidateCvOutputSchema,
  },
  async (input) => {
    const { output } = await cvAnalysisPrompt(input);
    return output!;
  }
);
