
'use client';

import { useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';

import { workers } from '@/lib/data';
import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function TerminationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const worker = workers.find((w) => w.id === id);

  if (!worker) {
    notFound();
  }

  const handleTermination = () => {
    // Here you would typically call a server action or API to update the worker's status
    toast({
        title: "Processo de Desligamento Iniciado",
        description: `O processo de desligamento para ${worker.name} foi iniciado e está pendente de aprovação final.`,
    });
    router.push(`/dashboard/workers/${id}`);
  }

  return (
    <>
      <DashboardHeader title={`Desligamento de Trabalhador`}>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retroceder
        </Button>
        <Button onClick={handleTermination}>
            <Send className="mr-2 h-4 w-4" /> Confirmar Desligamento
        </Button>
      </DashboardHeader>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Formulário de Rescisão de Contrato</CardTitle>
          <CardDescription>
            Documentar o processo de desligamento para <span className="font-bold">{worker.name}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="termination-date">Data de Efetivação do Desligamento</Label>
                <Input id="termination-date" type="date" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="termination-reason">Motivo da Rescisão</Label>
                <Select>
                    <SelectTrigger id="termination-reason">
                        <SelectValue placeholder="Selecione o motivo..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fim-contrato">Fim de Contrato a Termo</SelectItem>
                        <SelectItem value="justa-causa">Rescisão por Justa Causa</SelectItem>
                        <SelectItem value="mutuo-acordo">Rescisão por Mútuo Acordo</SelectItem>
                        <SelectItem value="iniciativa-trabalhador">Iniciativa do Trabalhador</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="termination-notes">Notas / Observações Adicionais</Label>
                <Textarea id="termination-notes" placeholder="Detalhes sobre o motivo, acordo de saída, etc." />
            </div>
            <div className="space-y-2">
                <Label htmlFor="final-feedback">Feedback da Entrevista de Desligamento (se aplicável)</Label>
                <Textarea id="final-feedback" placeholder="Pontos chave da conversa de saída." />
            </div>
        </CardContent>
      </Card>
    </>
  );
}

