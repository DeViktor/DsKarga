
'use client';

import { Worker } from "@/lib/data";
import { Logo } from "@/components/icons";
import Image from "next/image";
import { Building, User } from "lucide-react";

interface WorkerPassPrintLayoutProps {
    worker: Worker;
}

export function WorkerPassPrintLayout({ worker }: WorkerPassPrintLayoutProps) {

  return (
    <div className="print-this">
        <div className="w-[85.6mm] h-[53.98mm] mx-auto bg-white text-black flex flex-col border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <header className="px-4 pt-3 pb-2 flex justify-between items-center bg-gray-50">
                <div className="w-1/2">
                    <Logo />
                </div>
                <div className="w-1/2 text-right">
                    <p className="text-[7px] font-bold text-gray-500 tracking-wider">PASSE DE TRABALHADOR</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex items-center gap-3 px-4">
                 <div className="w-20 h-20 border-2 border-gray-200 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    <Image
                        src={`https://picsum.photos/seed/${worker.id}/100/100`}
                        alt={`Foto de ${worker.name}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                    />
                </div>
                <div className="space-y-1">
                    <p className="text-base font-bold leading-tight text-gray-800">{worker.name}</p>
                    <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-gray-500"/>
                        <p className="text-xs text-gray-600">{worker.role}</p>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <Building className="h-3 w-3 text-gray-500"/>
                        <p className="text-xs text-gray-600">{worker.department}</p>
                    </div>
                    <p className="text-[9px] text-gray-500 pt-1">ID: {worker.id}</p>
                </div>
            </main>
            
            {/* Footer */}
            <footer className="bg-red-700 h-2 w-full"></footer>
        </div>
    </div>
  );
}
