

'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

import { workers, type Worker } from '@/lib/data';
import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Download } from 'lucide-react';
import { ContractPrintLayout } from '@/components/dashboard/worker-contract-print-layout';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type ContractFormData = {
  name: string;
  nationality: string;
  address: string;
  maritalStatus: string;
  birthDate: string;
  bi: string;
  role: string;
  baseSalary: number;
  companySignatory: string;
};

export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const worker = workers.find((w) => w.id === id);

  const [isPrinting, setIsPrinting] = useState(false);

  const { register, control, watch } = useForm<ContractFormData>({
    defaultValues: {
      name: worker?.name || '',
      nationality: 'Angolana',
      address: 'Luanda', // Placeholder
      maritalStatus: 'Solteiro(a)', // Placeholder
      birthDate: 'N/A', // Placeholder
      bi: 'N/A', // Placeholder
      role: worker?.role || '',
      baseSalary: worker?.baseSalary || 0,
      companySignatory: 'Rodolfo Simão Mendes',
    }
  });

  const contractData = useWatch({ control });

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 100); // Delay to allow state update and re-render
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  if (!worker) {
    notFound();
  }

  const handlePrint = () => {
    setIsPrinting(true);
  };

  return (
    <>
      <DashboardHeader title="Gerar Contrato de Trabalho">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retroceder
        </Button>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button><Download className="mr-2 h-4 w-4" /> Baixar Contrato</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={handlePrint}>Baixar como PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>Baixar como Word (.docx)</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </DashboardHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="font-headline">Editar Dados do Contrato</CardTitle>
              <CardDescription>Ajuste os campos antes de gerar o documento final.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Trabalhador</Label>
                <Input id="name" {...register("name")} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Input id="role" {...register("role")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseSalary">Salário Base (AKZ)</Label>
                <Input id="baseSalary" type="number" {...register("baseSalary", { valueAsNumber: true })} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="bi">Nº B.I.</Label>
                <Input id="bi" {...register("bi")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Input id="nationality" {...register("nationality")} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="maritalStatus">Estado Civil</Label>
                <Input id="maritalStatus" {...register("maritalStatus")} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" {...register("birthDate")} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="address">Residência</Label>
                <Textarea id="address" {...register("address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySignatory">Signatário (DS Karga)</Label>
                <Input id="companySignatory" {...register("companySignatory")} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
                <CardTitle className="font-headline">Pré-visualização do Contrato</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-white rounded-md shadow-lg h-[80vh] overflow-y-auto">
                    <ContractPrintLayout worker={worker} contractData={contractData} />
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
