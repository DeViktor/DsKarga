
'use client';

import { Worker } from "@/lib/data";
import { Logo } from "@/components/icons";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export interface DisciplinaryAction {
    id?: number;
    type: 'verbal' | 'escrita' | 'suspensao';
    date: string;
    description: string;
    actionTaken?: string;
}

interface PrintLayoutProps {
    worker: Worker;
    action: DisciplinaryAction;
}

export function WorkerDisciplinaryPrintLayout({ worker, action }: PrintLayoutProps) {
    const today = new Date();
    
  return (
    <div className="print-this">
      <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-12 text-sm leading-relaxed flex flex-col font-serif">
        <header className="flex justify-between items-start mb-12">
            <div className="w-1/2">
                <Logo />
            </div>
            <div className="w-1/2 text-right">
                <p>Luanda, {format(today, "dd 'de' MMMM 'de' yyyy", { locale: pt })}</p>
            </div>
        </header>

        <main className="flex-grow">
            <h1 className="text-center font-bold text-lg mb-8 uppercase">NOTA DE ADVERTÊNCIA DISCIPLINAR</h1>
            
            <div className="space-y-4">
                <p>À</p>
                <p className="font-bold">Direcção dos Recursos Humanos</p>
                <p className="font-bold">DS Karga</p>
                <p>Luanda</p>
            </div>

            <p className="mt-8 font-bold">Assunto: Comunicação de Advertência Disciplinar</p>

            <div className="mt-6 space-y-4">
                 <p>Exmos. Senhores,</p>
                 <p>
                    Serve a presente para comunicar que o trabalhador <span className="font-bold">{worker.name}</span>, portador do B.I. nº (a ser preenchido), a exercer a função de <span className="font-bold">{worker.role}</span>, foi advertido em conformidade com o disposto na Lei Geral do Trabalho, devido à seguinte ocorrência:
                 </p>
                 <div className="p-4 border border-gray-300 bg-gray-50 min-h-[100px]">
                    <p><span className="font-semibold">Data da Ocorrência:</span> {action.date ? format(new Date(action.date), 'dd/MM/yyyy') : 'N/A'}</p>
                    <p className="mt-2"><span className="font-semibold">Descrição da Falta:</span></p>
                    <p>{action.description}</p>
                 </div>
                 <p>
                    O comportamento acima descrito consubstancia uma violação dos deveres de obediência e disciplina, previstos no contrato de trabalho e na Lei Geral do Trabalho.
                 </p>
                 <p>
                    Face ao exposto, foi aplicada ao trabalhador uma sanção de <span className="font-bold">{action.type === 'escrita' ? 'advertência escrita' : action.type === 'suspensao' ? 'suspensão' : 'advertência verbal'}</span>. Espera-se que o trabalhador corrija o seu comportamento, sob pena de, em caso de reincidência, serem aplicadas medidas disciplinares mais severas, nos termos da lei.
                 </p>
                 <p>Com os melhores cumprimentos,</p>
            </div>
        </main>
        
        <footer className="mt-auto pt-16">
            <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                    <div className="border-t border-black pt-1">O Trabalhador</div>
                    <p className="text-xs mt-1">(Tomei conhecimento)</p>
                </div>
                <div>
                    <div className="border-t border-black pt-1">O Supervisor</div>
                </div>
                 <div>
                    <div className="border-t border-black pt-1">Recursos Humanos</div>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
}

