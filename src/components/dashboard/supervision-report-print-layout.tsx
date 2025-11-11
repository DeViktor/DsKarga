
'use client';

import { Logo } from "@/components/icons";
import { format } from 'date-fns';
import { type SupervisionReport } from "@/app/dashboard/supervision/[id]/page";

interface PrintLayoutProps {
    report: SupervisionReport;
}

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4 break-inside-avoid">
        <h2 className="font-bold text-base bg-gray-100 border border-gray-300 p-2 rounded-t-md -mx-2">{title}</h2>
        <div className="space-y-2 p-2 border border-t-0 rounded-b-md border-gray-300">{children}</div>
    </div>
);

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => {
    if (!value && typeof value !== 'number') return null;
    return (
        <div className="grid grid-cols-3 gap-4 text-xs py-1 border-b border-gray-200">
            <p className="font-semibold col-span-1 text-gray-600">{label}:</p>
            <p className="col-span-2">{value}</p>
        </div>
    );
};


export function SupervisionReportPrintLayout({ report }: PrintLayoutProps) {

  return (
    <div className="print-only">
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-8 text-sm">
            <header className="flex justify-between items-start mb-8">
                <div className="w-1/2">
                    <Logo />
                    <div className="text-xs mt-4 space-y-px">
                        <p className="font-bold">DS KARGA Engenhosos</p>
                        <p>Luanda, Urbanização Nova Vida, Rua 181, Casa 6024</p>
                        <p>Contribuinte: 5000870595</p>
                    </div>
                </div>
                <div className="w-1/2 text-right">
                    <h1 className='text-xl font-bold font-headline'>Relatório Diário de Supervisão</h1>
                </div>
            </header>

            <main className="flex-grow">
                <DetailSection title="I. Identificação e Contexto">
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Supervisor" value={report.supervisor} />
                        <DetailItem label="Data e Turno" value={report.reportDate ? format(new Date(report.reportDate), 'dd/MM/yyyy HH:mm') : 'N/A'} />
                        <DetailItem label="Cliente / Local" value={report.client} />
                        <DetailItem label="Condições Climáticas" value={report.weather} />
                    </div>
                    <DetailItem label="Atividade Supervisionada" value={report.activity} />
                </DetailSection>

                 <DetailSection title="II. Recursos Humanos e Presença">
                    <div className="grid grid-cols-4 gap-4">
                        <DetailItem label="Efetivo Alocado" value={report.staffAllocated} />
                        <DetailItem label="Faltas / Ausências" value={report.staffAbsences} />
                        <DetailItem label="Horas Normais" value={report.staffNormalHours} />
                        <DetailItem label="Horas Extras" value={report.staffExtraHours} />
                    </div>
                    <DetailItem label="Substituições" value={report.staffReplacements} />
                    <DetailItem label="Ocorrências de RH" value={report.staffIssues} />
                </DetailSection>

                <DetailSection title="III. Produtividade e Desempenho">
                     <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Meta do Dia/Turno" value={report.prodGoal} />
                        <DetailItem label="Resultado Alcançado" value={report.prodResult} />
                        <DetailItem label="Tempo Produtivo (h)" value={report.prodProductiveHours} />
                        <DetailItem label="Tempo Não Produtivo (h)" value={report.prodNonProductiveHours} />
                    </div>
                    <DetailItem label="Justificativa para Desvios" value={report.prodJustification} />
                </DetailSection>
                
                 <DetailSection title="IV. Segurança e Conformidade">
                     <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Utilização de EPIs" value={report.safetyEpi} />
                        <DetailItem label="Briefing de Segurança" value={report.safetyBriefing} />
                    </div>
                    <DetailItem label="Acidentes / Incidentes" value={report.safetyIncidents} />
                    <DetailItem label="Condições Inseguras" value={report.safetyUnsafeConditions} />
                </DetailSection>
                
                 <DetailSection title="V. Questões de Cliente e Pendências">
                    <DetailItem label="Feedback do Cliente" value={report.clientFeedback} />
                    <DetailItem label="Necessidades do Cliente" value={report.clientNeeds} />
                    <DetailItem label="Pendências (Follow-up)" value={report.pendingIssues} />
                </DetailSection>

                 <DetailSection title="VI. Observações e Recomendações">
                    <DetailItem label="Destaques do Dia" value={report.highlights} />
                    <DetailItem label="Recomendações" value={report.recommendations} />
                </DetailSection>
            </main>
            
            <footer className="mt-auto pt-8">
                 <div className="mt-16 pt-8">
                    <div className="w-1/2 h-12 border-b mx-auto"></div>
                    <p className="text-center text-sm mt-2">Assinatura do Supervisor</p>
                </div>
                <div className="text-center text-xs border-t border-black pt-4 mt-8">
                    <p>Processado por computador - DS KARGA SISTEM</p>
                    <p>Emitido em: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                </div>
            </footer>
        </div>
    </div>
  );
}
