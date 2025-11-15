
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
import { User, Mail, Phone, Briefcase, Star, GraduationCap, Languages, Award, Building, Calendar } from 'lucide-react';

interface CandidateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: (AnalyzedCandidate | DbCandidate) | null;
}

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number | null }) => {
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

export function CandidateDetailDialog({ open, onOpenChange, candidate }: CandidateDetailDialogProps) {
  if (!candidate) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{candidate.name}</DialogTitle>
          <DialogDescription>
            {candidate.role} | {candidate.seniority}
          </DialogDescription>
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
                <SectionTitle><GraduationCap/> Educação e Competências</SectionTitle>
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
                        ): null
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
