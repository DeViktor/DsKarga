
'use client';

import { Worker } from "@/lib/data";
import { Logo } from "@/components/icons";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface PayslipPrintLayoutProps {
    worker: Worker;
    salaryData: {
        period: string;
        baseSalary: number;
        inss: number;
        irt: number;
        netSalary: number;
    }
}

const numberFormat = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
};

export function WorkerPayslipPrintLayout({ worker, salaryData }: PayslipPrintLayoutProps) {
    const today = new Date();
    
  return (
    <div className="print-this">
      <div className="w-[210mm] h-[297mm] mx-auto bg-white text-black p-8 text-sm flex flex-col">
        <header className="flex justify-between items-start mb-8">
            <div className="w-1/2">
                <Logo />
                <div className="text-xs mt-4 space-y-px">
                    <p className="font-bold">DS ENGENHOSO – COMÉRCIO E PRESTAÇÃO DE SERVIÇOS (SU), LDA.</p>
                    <p>Sede: Luanda, Talatona, Bairro Kambamba, Rua do Siac, Casa nº 191</p>
                    <p>NIF: 5000870595</p>
                </div>
            </div>
            <div className="w-1/2 text-right">
                <h1 className="text-xl font-bold font-headline">RECIBO DE VENCIMENTO</h1>
                <p className="mt-1">Período: <span className="font-semibold">{salaryData.period}</span></p>
                <p>Data de Emissão: <span className="font-semibold">{format(today, 'dd/MM/yyyy')}</span></p>
            </div>
        </header>

        <section className="mb-6 p-4 border rounded-md border-gray-400">
            <h2 className="font-bold text-base mb-2">Dados do Trabalhador</h2>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                <div><span className="text-gray-600">Nome:</span> <span className="font-semibold">{worker.name}</span></div>
                <div><span className="text-gray-600">Função:</span> <span className="font-semibold">{worker.role}</span></div>
                <div><span className="text-gray-600">Departamento:</span> <span className="font-semibold">{worker.department}</span></div>
                <div><span className="text-gray-600">NIF:</span> <span className="font-semibold">N/A</span></div>
                <div><span className="text-gray-600">Nº Seg. Social:</span> <span className="font-semibold">N/A</span></div>
            </div>
        </section>

        <main className="flex-grow">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 text-left font-semibold border">Código</th>
                        <th className="p-2 text-left font-semibold border">Designação</th>
                        <th className="p-2 text-right font-semibold border">Abonos</th>
                        <th className="p-2 text-right font-semibold border">Descontos</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="p-2 border">001</td>
                        <td className="p-2 border">Vencimento Base</td>
                        <td className="p-2 border text-right">{numberFormat(salaryData.baseSalary)}</td>
                        <td className="p-2 border"></td>
                    </tr>
                    <tr>
                        <td className="p-2 border">101</td>
                        <td className="p-2 border">Segurança Social (INSS - 3%)</td>
                        <td className="p-2 border"></td>
                        <td className="p-2 border text-right">{numberFormat(salaryData.inss)}</td>
                    </tr>
                     <tr>
                        <td className="p-2 border">102</td>
                        <td className="p-2 border">Imposto sobre Rendimento (IRT)</td>
                        <td className="p-2 border"></td>
                        <td className="p-2 border text-right">{numberFormat(salaryData.irt)}</td>
                    </tr>
                     {/* Add empty rows for layout consistency */}
                    <tr className="h-8"><td className="border-x"></td><td className="border-x"></td><td className="border-x"></td><td className="border-x"></td></tr>
                    <tr className="h-8"><td className="border-x"></td><td className="border-x"></td><td className="border-x"></td><td className="border-x"></td></tr>
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={2} className="p-2 border text-right">TOTAIS</td>
                        <td className="p-2 border text-right">{numberFormat(salaryData.baseSalary)}</td>
                        <td className="p-2 border text-right">{numberFormat(salaryData.inss + salaryData.irt)}</td>
                    </tr>
                    <tr className="bg-gray-200 font-bold text-base">
                        <td colSpan={2} className="p-3 border text-right">VALOR LÍQUIDO A RECEBER</td>
                        <td colSpan={2} className="p-3 border text-right">{numberFormat(salaryData.netSalary)}</td>
                    </tr>
                </tfoot>
            </table>
        </main>
        
        <footer className="mt-auto pt-12">
             <div className="grid grid-cols-2 gap-16 text-center">
                <div>
                    <div className="border-t border-black pt-1">A Empresa</div>
                </div>
                <div>
                    <div className="border-t border-black pt-1">O Trabalhador</div>
                    <p className="text-xs mt-1">Declaro ter recebido a quantia líquida mencionada.</p>
                </div>
            </div>
             <div className="text-center text-xs pt-8 mt-8 border-t border-gray-300">
                <p>Processado por computador - DS KARGA SISTEM</p>
            </div>
        </footer>
      </div>
    </div>
  );
}
