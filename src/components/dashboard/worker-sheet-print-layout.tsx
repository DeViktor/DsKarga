
'use client';

import { Worker } from "@/lib/data";
import { Logo } from "@/components/icons";
import { format } from "date-fns";
import Image from "next/image";

interface WorkerSheetPrintLayoutProps {
    worker: Worker;
}

const DetailItem = ({ label, value }: { label: string; value?: string | number }) => (
    <div className="py-2 border-b">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium">{value || 'N/A'}</p>
    </div>
);


export function WorkerSheetPrintLayout({ worker }: WorkerSheetPrintLayoutProps) {
  const inss = (worker.baseSalary || 0) * 0.03;
  const irt = ((worker.baseSalary || 0) - inss) * 0.10;
  const netSalary = (worker.baseSalary || 0) - inss - irt;

  return (
    <div className="print-this">
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-8 text-sm">
            <header className="flex justify-between items-start mb-8">
                <div className="w-2/3">
                    <Logo />
                    <div className="text-xs mt-4 space-y-px">
                        <p className="font-bold">DS KARGA Engenhosos</p>
                        <p>Luanda, Urbanização Nova Vida, Rua 181, Casa 6024</p>
                        <p>Contribuinte: 5000870595</p>
                    </div>
                </div>
                 <div className="w-1/3">
                    <div className="w-40 h-40 border-2 border-gray-300 ml-auto flex items-center justify-center text-gray-400">
                        <Image 
                            src={`https://picsum.photos/seed/${worker.id}/200/200`} 
                            alt={`Foto de ${worker.name}`} 
                            width={160} 
                            height={160} 
                            className="object-cover w-full h-full"
                        />
                    </div>
                </div>
            </header>
            
            <h1 className="font-headline text-2xl font-bold text-center mb-8 border-y-2 border-black py-2">Ficha de Trabalhador</h1>

            <main className="grid grid-cols-3 gap-x-12 gap-y-6">
                <section className="col-span-3">
                    <h2 className="font-headline text-lg font-semibold border-b-2 border-gray-300 pb-1 mb-2">Dados Pessoais</h2>
                    <div className="grid grid-cols-3 gap-x-8">
                        <DetailItem label="Nome Completo" value={worker.name} />
                        <DetailItem label="Nacionalidade" value="Angolana" />
                        <DetailItem label="Data de Nascimento" value="N/A" />
                        <DetailItem label="Estado Civil" value="N/A" />
                        <DetailItem label="Gênero" value="Masculino" />
                        <DetailItem label="Nº B.I." value="006158685LA044" />
                        <DetailItem label="Residência" value="Luanda-Viana/ Estalagem" />
                        <DetailItem label="Contacto" value="N/A" />
                        <DetailItem label="Email" value="emanuelcosta63@gmail.com" />
                    </div>
                </section>
                
                 <section className="col-span-3">
                    <h2 className="font-headline text-lg font-semibold border-b-2 border-gray-300 pb-1 mb-2">Dados Profissionais e Contratuais</h2>
                    <div className="grid grid-cols-3 gap-x-8">
                        <DetailItem label="ID do Trabalhador" value={worker.id} />
                        <DetailItem label="Função" value={worker.role} />
                        <DetailItem label="Departamento" value={worker.department} />
                        <DetailItem label="Data de Admissão" value="N/A" />
                        <DetailItem label="Tipo de Contrato" value="N/A" />
                        <DetailItem label="Estado do Contrato" value={worker.contractStatus} />
                         <DetailItem label="Local de Alocação" value="CUCA" />
                    </div>
                </section>

                 <section className="col-span-3">
                    <h2 className="font-headline text-lg font-semibold border-b-2 border-gray-300 pb-1 mb-2">Informações Salariais</h2>
                    <div className="grid grid-cols-3 gap-x-8">
                         <DetailItem label="Salário Base" value={(worker.baseSalary || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} />
                        <DetailItem label="Desconto INSS (3%)" value={inss.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} />
                        <DetailItem label="Desconto IRT" value={irt.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} />
                         <div className="py-2 border-b">
                            <p className="text-xs text-gray-500">Salário Líquido</p>
                            <p className="font-bold text-base">{netSalary.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                        </div>
                        <DetailItem label="NIB/IBAN" value="N/A" />
                    </div>
                </section>
            </main>
            
            <footer className="mt-auto pt-12">
                <div className="grid grid-cols-2 gap-16 text-center">
                    <div>
                        <div className="border-t border-black pt-1">Assinatura do Trabalhador</div>
                    </div>
                    <div>
                        <div className="border-t border-black pt-1">A Empresa</div>
                    </div>
                </div>
                 <div className="text-center text-xs pt-8 mt-8 border-t border-gray-300">
                    <p>Ficha gerada em {format(new Date(), "dd/MM/yyyy HH:mm")} por DS KARGA SISTEM</p>
                </div>
            </footer>
        </div>
    </div>
  );
}

    