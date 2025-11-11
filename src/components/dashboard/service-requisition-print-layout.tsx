
'use client';

import { Logo } from "@/components/icons";
import { type Service } from "@/hooks/use-services";
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import Image from "next/image";

interface PrintLayoutProps {
    service: Service;
}

export function ServiceRequisitionPrintLayout({ service }: PrintLayoutProps) {

  return (
    <div className="print-this">
        <div className="w-[210mm] h-[297mm] mx-auto bg-white text-black p-8 flex flex-col">
            <div className="flex justify-between items-start mb-8">
                <div className="w-1/2">
                    <Logo />
                        <div className="text-xs mt-4 space-y-px">
                        <p className="font-bold">DS KARGA Engenhosos</p>
                        <p>Luanda, Urbanização Nova Vida, Rua 181, Casa 6024</p>
                        <p>Contribuinte: 5000870595</p>
                    </div>
                </div>
                    <div className="w-1/2 text-right">
                    <div className='flex justify-end items-center gap-4'>
                        <div>
                        <h1 className='text-2xl font-bold font-headline'>GUIA DE REQUISIÇÃO DE MÃO DE OBRA</h1>
                        <p className='font-mono font-bold mt-2'>{service.guideNumber}</p>
                        </div>
                        <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${service.guideNumber}`} alt="QR Code" width={80} height={80} />
                    </div>
                </div>
            </div>

            <Card className='shadow-none border-gray-400'>
                <CardContent className="p-4 grid grid-cols-3 gap-4 text-sm">
                    <div><p className="font-bold">Área Solicitante:</p><p>{service.requestingArea}</p></div>
                    <div><p className="font-bold">Responsável:</p><p>{service.responsible}</p></div>
                    <div><p className="font-bold">Data:</p><p>{format(service.requestDate.toDate(), 'dd/MM/yyyy')}</p></div>
                </CardContent>
            </Card>
            
            <div className='my-6 space-y-4 text-sm'>
                <div><h4 className='font-bold text-base border-b-2 border-black pb-1 mb-2'>Motivo da Solicitação</h4><p>{service.reason}</p></div>
                <div><h4 className='font-bold text-base border-b-2 border-black pb-1 mb-2'>Principais Atividades</h4><p>{service.mainActivities}</p></div>
            </div>

            <div className='my-6 grid grid-cols-3 gap-4 text-sm'>
                    <div className='p-2 border rounded-md border-gray-400'><p className="font-bold">Tempo Estimado:</p><p>{service.estimatedTime}</p></div>
                    <div className='p-2 border rounded-md border-gray-400'><p className="font-bold">Pessoal Estimado:</p><p>{service.estimatedStaff}</p></div>
                    <div className='p-2 border rounded-md border-gray-400'><p className="font-bold">Orçamento:</p><p>{service.budget?.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }) || 'N/A'}</p></div>
            </div>
            
            <div className="flex-grow"></div>

            <div className="space-y-12">
                <div className="grid grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="border-t border-black w-full mx-auto pt-1">Chefe da Área Solicitante</div>
                    </div>
                        <div>
                        <div className="border-t border-black w-full mx-auto pt-1">Recursos Humanos (Cliente)</div>
                    </div>
                        <div>
                        <div className="border-t border-black w-full mx-auto pt-1">Diretor Fabril</div>
                    </div>
                </div>

                    <div className="text-center text-xs pt-4 border-t border-black">
                    <p>Processado por computador - DS KARGA SISTEM</p>
                </div>
            </div>
        </div>
    </div>
  );
}
