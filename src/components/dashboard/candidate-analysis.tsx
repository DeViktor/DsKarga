
'use client';

import { useState, useRef, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, CheckCircle } from 'lucide-react';
import { analyzeCandidateCv } from '@/lib/actions';
import { ScrollArea } from '../ui/scroll-area';
import { AnalyzeCandidateCvOutput } from '@/ai/flows/analyze-candidate-cv';

export type AnalyzedCandidate = AnalyzeCandidateCvOutput;

interface CandidateAnalysisProps {
  children: ReactNode;
  onCandidateAdded: (candidate: AnalyzedCandidate) => void;
}

export function CandidateAnalysis({ children, onCandidateAdded }: CandidateAnalysisProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setAnalysisResult(null);
      } else {
        toast({
          title: 'Ficheiro Inválido',
          description: 'Por favor, selecione um ficheiro PDF.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: 'Nenhum Ficheiro',
        description: 'Por favor, selecione um CV em formato PDF para analisar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeCandidateCv(file);
      setAnalysisResult(result);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast({
        title: 'Erro na Análise',
        description: error.message || 'Não foi possível analisar o CV. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCandidate = () => {
    if (analysisResult) {
      onCandidateAdded(analysisResult);
      toast({
        title: 'Candidato Adicionado!',
        description: `${analysisResult.name} foi adicionado ao seu banco de talentos.`,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setAnalysisResult(null);
    setIsLoading(false);
    if(fileInputRef.current) fileInputRef.current.value = '';
    setOpen(false);
  };
  
  const AnalysisResultDisplay = ({ result }: { result: AnalyzedCandidate }) => (
    <div className="space-y-4">
        <h3 className="font-semibold text-lg text-center">Resultados da Análise de IA</h3>
        <div className="p-4 border rounded-lg bg-muted/50 max-h-96">
          <ScrollArea className="h-96">
            <div className='pr-4 space-y-4'>
              <p><strong>Nome:</strong> {result.name}</p>
              <p><strong>Email:</strong> {result.email}</p>
              <p><strong>Telefone:</strong> {result.phoneNumber}</p>
              <p><strong>Idade:</strong> {result.age}</p>
              <p><strong>Cargo Sugerido:</strong> {result.role}</p>
              <p><strong>Senioridade:</strong> {result.seniority}</p>
              <p><strong>Área de Especialização:</strong> {result.areaOfSpecialization}</p>
              <p><strong>Anos de Experiência:</strong> {result.yearsOfExperience}</p>
              <p><strong>Resumo da Experiência:</strong> {result.experienceSummary}</p>
              <p><strong>Educação:</strong> {result.course}</p>
              <p><strong>Qualificações:</strong> {result.qualifications}</p>
              <p><strong>Competências:</strong> {result.skills}</p>
              <p><strong>Idiomas:</strong> {result.languages}</p>
              <p><strong>Empresas Anteriores:</strong> {result.previousCompanies}</p>
              <p><strong>Certificações:</strong> {result.certifications}</p>
            </div>
          </ScrollArea>
        </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={handleClose}>
        <DialogHeader>
          <DialogTitle className="font-headline">Analisar CV com IA</DialogTitle>
          <DialogDescription>
            Carregue um CV em formato PDF. A nossa IA irá extrair as informações mais importantes para criar um perfil de candidato.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {!analysisResult ? (
            <div className="space-y-4">
                <Label htmlFor="cv-file">Ficheiro do CV (PDF)</Label>
                <div className='flex gap-2'>
                    <Input id="cv-file" type="file" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} className='flex-grow'/>
                     <Button onClick={handleAnalyze} disabled={isLoading || !file}>
                        {isLoading ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A analisar...</> ) : 'Analisar'}
                    </Button>
                </div>
            </div>
          ) : null}

          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center gap-2 p-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">A analisar o CV...</p>
              <p className="text-sm text-muted-foreground">Isto pode demorar alguns segundos.</p>
            </div>
          )}

          {analysisResult && <AnalysisResultDisplay result={analysisResult} />}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {analysisResult ? 'Fechar' : 'Cancelar'}
          </Button>
          {analysisResult && (
            <Button type="button" onClick={handleSaveCandidate}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Guardar Candidato
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
