
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type AnalyzedCandidate } from './candidate-analysis';
import { type Candidate as DbCandidate } from '@/hooks/use-candidates';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { User, Mail, Phone, Briefcase, Star, GraduationCap, Languages, Award, Building, Calendar, Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CandidateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: (AnalyzedCandidate | DbCandidate) | null;
}

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: any }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <div className="text-muted-foreground text-sm">{value}</div>
      </div>
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-headline text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
    {children}
  </h3>
);

export function CandidateDetailDialog({ open, onOpenChange, candidate: initialCandidate }: CandidateDetailDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState(initialCandidate);
  const [isUploading, setIsUploading] = useState(false);

  // Sync state with prop
  useState(() => {
    if (initialCandidate !== candidate) {
      setCandidate(initialCandidate);
    }
  });

  if (!candidate) {
    return null;
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !candidate) return;

    const candidateId = (candidate as any).id;
    if (!candidateId) {
      toast({ title: "Erro", description: "Candidato ainda não foi guardado.", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: "Tipo de ficheiro inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Tamanho máximo permitido é 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const supabase = getSupabaseClient();
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_WORKER_PHOTOS_BUCKET || 'worker-photos';
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `candidates/${candidateId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(path);

      const publicUrl = publicData.publicUrl;

      const { error: dbError } = await supabase
        .from('candidates')
        .update({ photo_url: publicUrl })
        .eq('id', candidateId);

      if (dbError) throw dbError;

      setCandidate(prev => prev ? { ...prev, photoUrl: publicUrl } : prev);
      toast({ title: "Foto atualizada", description: "A foto foi enviada para o Supabase." });
    } catch (err: any) {
      console.error('Erro no upload da foto', err);
      toast({
        title: "Erro ao enviar foto",
        description: err.message || "Verifique permissões do bucket e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="flex flex-row items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={(candidate as any).photoUrl} />
              <AvatarFallback>{candidate.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button
              variant="secondary"
              size="icon"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-md"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </div>
          <div>
            <DialogTitle className="font-headline text-2xl">{candidate.name}</DialogTitle>
            <DialogDescription>
              {candidate.role} | {candidate.seniority}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-[60vh]">
            <div className="pr-6 space-y-8">
              <div>
                <SectionTitle><User /> Dados Pessoais</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem icon={Mail} label="Email" value={candidate.email} />
                  <DetailItem icon={Phone} label="Telefone" value={candidate.phoneNumber} />
                  <DetailItem icon={Calendar} label="Idade" value={candidate.age} />
                </div>
              </div>

              <div>
                <SectionTitle><Briefcase /> Perfil Profissional</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem icon={Star} label="Área de Especialização" value={candidate.areaOfSpecialization} />
                  <DetailItem icon={Calendar} label="Anos de Experiência" value={candidate.yearsOfExperience} />
                  <DetailItem icon={Building} label="Empresas Anteriores" value={candidate.previousCompanies} />
                </div>
                <div className="mt-4">
                  <p className="font-semibold text-sm">Resumo da Experiência</p>
                  <p className="text-muted-foreground text-sm mt-1">{candidate.experienceSummary}</p>
                </div>
              </div>

              <div>
                <SectionTitle><GraduationCap /> Educação e Competências</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem icon={GraduationCap} label="Curso Principal" value={candidate.course} />
                  <DetailItem icon={Languages} label="Idiomas" value={candidate.languages} />
                  <DetailItem icon={Award} label="Certificações" value={
                    candidate.certifications ? (
                      <div className="flex flex-col items-start gap-1">
                        {candidate.certifications.split(',').map(cert => <span key={cert}>{cert.trim()}</span>)}
                      </div>
                    ) : null
                  } />
                  <DetailItem icon={Star} label="Competências" value={
                    candidate.skills ? (
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.split(',').map(skill => (
                          <Badge key={skill} variant="secondary">{skill.trim()}</Badge>
                        ))}
                      </div>
                    ) : null
                  } />
                </div>
              </div>

            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
