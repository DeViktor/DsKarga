
'use client';

import { useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Upload, UserPlus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CandidateAnalysis, type AnalyzedCandidate } from '@/components/dashboard/candidate-analysis';
import { CandidateDetailDialog } from '@/components/dashboard/candidate-detail-dialog';
import { useCandidates } from '@/hooks/use-candidates';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function CandidatesPage() {
  const { candidates, loading } = useCandidates();
  const { toast } = useToast();
  const [selectedCandidate, setSelectedCandidate] = useState<AnalyzedCandidate | null>(null);

  const handleAddCandidate = async (candidate: AnalyzedCandidate) => {
    try {
      const supabase = getSupabaseClient();
      const payload = {
        name: candidate.name,
        role: candidate.role,
        email: candidate.email,
        phone_number: candidate.phoneNumber,
        seniority: candidate.seniority,
        gender: candidate.gender,
        age: candidate.age,
        area_of_specialization: candidate.areaOfSpecialization,
        years_of_experience: candidate.yearsOfExperience,
        course: candidate.course,
        skills: candidate.skills,
        qualifications: candidate.qualifications,
        languages: candidate.languages,
        previous_companies: candidate.previousCompanies,
        certifications: candidate.certifications,
        experience_summary: candidate.experienceSummary,
        status: 'Pendente',
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('candidates').insert(payload);
      if (error) throw error;
      toast({ title: 'Candidato guardado', description: 'O candidato foi guardado no Supabase.' });
    } catch (err: any) {
      const message = (typeof err?.message === 'string' ? err.message : 'Falha ao guardar candidato no Supabase');
      console.error('Erro ao guardar candidato', err);
      toast({ title: 'Erro ao guardar', description: message, variant: 'destructive' });
    }
  };

  return (
    <>
      <DashboardHeader title="Banco de Talentos">
        <p className="text-sm text-muted-foreground hidden lg:block">
          Gira e analise os seus candidatos com o poder da IA.
        </p>
        <div className="flex-1 flex justify-end items-center gap-2">
            <CandidateAnalysis onCandidateAdded={handleAddCandidate}>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Analisar e Adicionar CV
              </Button>
            </CandidateAnalysis>
        </div>
      </DashboardHeader>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Candidatos em Base de Dados</CardTitle>
          <CardDescription>
            Lista de todos os candidatos analisados e adicionados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo Sugerido</TableHead>
                <TableHead>Área de Especialização</TableHead>
                <TableHead>Anos Exp.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!candidates || candidates.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                    <p>Nenhum candidato na base de dados.</p>
                    <p className="text-sm">Use o botão "Analisar e Adicionar CV" para começar.</p>
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.name || '—'}</TableCell>
                    <TableCell>{candidate.role || '—'}</TableCell>
                    <TableCell>{candidate.areaOfSpecialization || '—'}</TableCell>
                    <TableCell>{candidate.yearsOfExperience ?? '—'}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedCandidate(candidate)}>
                            Ver Detalhes
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <CandidateDetailDialog
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onOpenChange={(isOpen) => !isOpen && setSelectedCandidate(null)}
      />
    </>
  );
}
