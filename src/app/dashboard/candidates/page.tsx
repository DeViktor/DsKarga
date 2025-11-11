
'use client';

import { useState } from 'react';
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

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<AnalyzedCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<AnalyzedCandidate | null>(null);

  const handleAddCandidate = (candidate: AnalyzedCandidate) => {
    setCandidates((prev) => [...prev, candidate]);
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
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                    <p>Nenhum candidato na base de dados.</p>
                    <p className="text-sm">Use o botão "Analisar e Adicionar CV" para começar.</p>
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{candidate.name}</TableCell>
                    <TableCell>{candidate.role}</TableCell>
                    <TableCell>{candidate.areaOfSpecialization}</TableCell>
                    <TableCell>{candidate.yearsOfExperience}</TableCell>
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
