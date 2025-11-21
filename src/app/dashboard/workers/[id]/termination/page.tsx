
'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';

import { DashboardHeader } from '@/components/dashboard/header';
import { getSupabaseClient } from '@/lib/supabase/client';
import { createTerminationRequest } from '@/lib/supabase/actions';
import type { Worker } from '@/types/worker';
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
  
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminationDate, setTerminationDate] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationNotes, setTerminationNotes] = useState('');
  const [finalFeedback, setFinalFeedback] = useState('');

  useEffect(() => {
    async function fetchWorker() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('workers')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          const normalized: Worker = {
            id: data.id,
            name: data.name ?? '',
            role: data.role ?? '',
            department: data.department ?? '',
            category: data.category ?? '',
            baseSalary: Number(data.base_salary ?? 0),
            contractStatus: (data.contract_status ?? 'Ativo') as Worker['contractStatus'],
            type: (data.type ?? 'Eventual') as Worker['type'],
          };
          setWorker(normalized);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Erro ao carregar trabalhador:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    
    fetchWorker();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!worker) {
    notFound();
  }

  const handleTermination = async () => {
    if (!terminationDate || !terminationReason) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha a data de desligamento e o motivo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTerminationRequest(String(id), worker.name, {
        terminationDate,
        terminationReason,
        terminationNotes,
        finalFeedback,
      });

      toast({
        title: "Solicitação Enviada!",
        description: `Solicitação de desligamento de ${worker.name} enviada para aprovação.`,
      });
      router.push('/dashboard/approvals');
    } catch (error) {
      console.error('Erro ao criar solicitação de desligamento:', error);
      toast({
        title: "Erro!",
        description: "Não foi possível enviar a solicitação de desligamento.",
        variant: "destructive",
      });
    }
  };

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
                <Input 
                  id="termination-date" 
                  type="date" 
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="termination-reason">Motivo da Rescisão</Label>
                <Select value={terminationReason} onValueChange={setTerminationReason}>
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
                <Textarea 
                  id="termination-notes" 
                  placeholder="Detalhes sobre o motivo, acordo de saída, etc."
                  value={terminationNotes}
                  onChange={(e) => setTerminationNotes(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="final-feedback">Feedback da Entrevista de Desligamento (se aplicável)</Label>
                <Textarea 
                  id="final-feedback" 
                  placeholder="Pontos chave da conversa de saída."
                  value={finalFeedback}
                  onChange={(e) => setFinalFeedback(e.target.value)}
                />
            </div>
        </CardContent>
      </Card>
    </>
  );
}

