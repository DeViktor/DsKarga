

'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as XLSX from 'xlsx';

import { DashboardHeader } from '@/components/dashboard/header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Printer, FileDown, CheckCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { workers as allWorkers, type Worker } from '@/lib/data';
import { useServices, type Service } from '@/hooks/use-services';
import { Loader2 } from 'lucide-react';
import { PaymentGuidePrintLayout } from '@/components/dashboard/payment-guide-print-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';


const paymentSchema = z.object({
  workers: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      department: z.string().optional(),
      category: z.string().optional(),
      daysWorked: z.coerce.number().default(0),
      baseSalary: z.coerce.number().default(0),
      dailyValue: z.coerce.number().default(0),
    })
  ),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
export type PaymentCalculatedValues = {
    grossTotal: number;
    inss: number;
    irt: number;
    retention: number;
    netTotal: number;
};

const numberFormat = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
};

function parseDaysFromString(timeString: string): number {
    if (!timeString) return 22; // Default
    const match = timeString.match(/(\d+)\s*dias?/);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return 22; // Default if no day value is found
}

const servicesNav = [
    { name: "Gestão de Serviços", href: "/dashboard/services" },
    { name: "Novo Serviço", href: "/dashboard/services/new" },
    { name: "Guias de Pagamento", href: "/dashboard/services/payment-guide" },
];

const calculateIRT = (base: number): number => {
    if (base <= 100000) return 0;
    if (base <= 150000) return (base - 100000) * 0.13;
    if (base <= 200000) return 6500 + (base - 150000) * 0.16; // 12500 is incorrect in user prompt, 50k*0.13=6500
    if (base <= 300000) return 14500 + (base - 200000) * 0.18; // 6500+8000=14500
    if (base <= 500000) return 32500 + (base - 300000) * 0.19; // 14500+18000=32500
    if (base <= 1000000) return 70500 + (base - 500000) * 0.20; // 32500+38000=70500
    if (base <= 1500000) return 170500 + (base - 1000000) * 0.21; // 70500+100000=170500
    if (base <= 2000000) return 275500 + (base - 1500000) * 0.22; // 170500+105000=275500
    if (base <= 2500000) return 385500 + (base - 2000000) * 0.23; // 275500+110000=385500
    if (base <= 5000000) return 500500 + (base - 2500000) * 0.24; // 385500+115000=500500
    if (base <= 10000000) return 1100500 + (base - 5000000) * 0.245; // 500500+600000=1100500
    return 2325500 + (base - 10000000) * 0.25; // 1100500+1225000=2325500
};


export default function PaymentGuidePage() {
  const pathname = usePathname();
  const { services, loading: servicesLoading } = useServices();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [guideStatus, setGuideStatus] = useState<'Pendente' | 'Aprovado'>('Pendente');

  const [retentionRate, setRetentionRate] = useState(6.5);
  const [inssEmployeeRate, setInssEmployeeRate] = useState(3);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      workers: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'workers',
  });

  const watchWorkers = form.watch('workers');
  
  const handleServiceChange = (serviceId: string) => {
    if (!services) return;
    setGuideStatus('Pendente');
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      const daysWorked = parseDaysFromString(service.estimatedTime);
      const allocatedWorkersData = service.assignedWorkers?.map(assignedWorker => {
        const workerData = allWorkers.find(w => w.id === assignedWorker.id);
        const baseSalary = workerData?.baseSalary || 0;
        const dailyValue = baseSalary / 22; // Assume 22 working days

        return {
          id: assignedWorker.id,
          name: assignedWorker.name,
          department: workerData?.department || '',
          category: workerData?.category || '',
          daysWorked: daysWorked,
          baseSalary: baseSalary,
          dailyValue: dailyValue
        };
      }) || [];
      replace(allocatedWorkersData);
    } else {
        setSelectedService(null);
        replace([]);
    }
  };


  const handleValueChange = (index: number, field: 'baseSalary' | 'dailyValue' | 'daysWorked', value: number) => {
    const worker = watchWorkers[index];
    let { baseSalary, dailyValue, daysWorked } = worker;
    const workingDaysInMonth = 22;

    if (field === 'daysWorked') {
        daysWorked = value;
    } else if (field === 'dailyValue') {
      dailyValue = value;
      baseSalary = dailyValue * workingDaysInMonth;
    } else if (field === 'baseSalary') {
      baseSalary = value;
      dailyValue = baseSalary > 0 ? baseSalary / workingDaysInMonth : 0;
    }
    
    form.setValue(`workers.${index}.daysWorked`, daysWorked, { shouldValidate: true });
    form.setValue(`workers.${index}.dailyValue`, dailyValue, { shouldValidate: true });
    form.setValue(`workers.${index}.baseSalary`, baseSalary, { shouldValidate: true });
  };


  const calculatedValues: PaymentCalculatedValues[] = watchWorkers.map(worker => {
      const { daysWorked, dailyValue } = worker;
      const grossTotal = dailyValue * daysWorked;
      
      const inss = grossTotal * (inssEmployeeRate / 100);
      const materiaColetavel = grossTotal - inss;
      const irt = calculateIRT(materiaColetavel);
      const retention = grossTotal * (retentionRate / 100);
      
      const netTotal = grossTotal - inss - irt - retention;
      
      return { grossTotal, inss, irt, retention, netTotal };
  });
  
  const addNewWorker = () => {
    const newWorker: Worker = {
        id: `manual-${fields.length + 1}`,
        name: '',
        department: '',
        role: '',
        contractStatus: 'Ativo',
        baseSalary: 0,
        category: ''
    };
    append({
        id: newWorker.id,
        name: newWorker.name,
        department: newWorker.department,
        category: newWorker.category,
        daysWorked: selectedService ? parseDaysFromString(selectedService.estimatedTime) : 22,
        baseSalary: 0,
        dailyValue: 0,
    });
  }
  
  const handlePrint = () => {
    window.print();
  }
  
  const exportToExcel = () => {
    const dataToExport = watchWorkers.map((worker, index) => ({
      'Nome': worker.name,
      'Departamento': worker.department,
      'Categoria': worker.category,
      'Nº Dias Trab.': worker.daysWorked,
      'Vencimento Base': worker.baseSalary,
      'Valor Dia': worker.dailyValue,
      'Total Bruto': calculatedValues[index].grossTotal,
      'INSS (3%)': calculatedValues[index].inss,
      'IRT': calculatedValues[index].irt,
      [`Retenção (${retentionRate}%)`]: calculatedValues[index].retention,
      'Total Líquido': calculatedValues[index].netTotal,
    }));
    
    const totals = calculatedValues.reduce((acc, curr) => ({
        grossTotal: acc.grossTotal + curr.grossTotal,
        inss: acc.inss + curr.inss,
        irt: acc.irt + curr.irt,
        retention: acc.retention + curr.retention,
        netTotal: acc.netTotal + curr.netTotal,
    }), { grossTotal: 0, inss: 0, irt: 0, retention: 0, netTotal: 0 });

    dataToExport.push({
        'Nome': 'TOTAIS',
        'Departamento': '',
        'Categoria': '',
        'Nº Dias Trab.': '',
        'Vencimento Base': '',
        'Valor Dia': '',
        'Total Bruto': totals.grossTotal,
        'INSS (3%)': totals.inss,
        'IRT': totals.irt,
        [`Retenção (${retentionRate}%)`]: totals.retention,
        'Total Líquido': totals.netTotal,
    } as any);

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Guia de Pagamento');
    XLSX.writeFile(workbook, `Guia_Pagamento_${selectedService?.guideNumber || 'Servico'}.xlsx`);
  };

  return (
    <>
      <DashboardHeader title="Guia de Pagamento de Serviços Eventuais">
          <div className='flex items-center gap-2 print:hidden'>
            <Button variant="outline" onClick={exportToExcel} disabled={fields.length === 0 || guideStatus !== 'Aprovado'}>
                <FileDown className="mr-2"/> Baixar Excel
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={fields.length === 0 || guideStatus !== 'Aprovado'}>
                <Printer className="mr-2"/> Baixar PDF
            </Button>
            <Button onClick={() => setGuideStatus('Aprovado')} disabled={fields.length === 0 || guideStatus === 'Aprovado'}>
                <CheckCircle className="mr-2"/> Aprovar Guia
            </Button>
          </div>
      </DashboardHeader>
      
       <Tabs value={pathname} className="w-full mb-6 print:hidden">
            <TabsList>
                {servicesNav.map((item) => (
                     <Link key={item.name} href={item.href} passHref>
                        <TabsTrigger value={item.href}>
                            {item.name}
                        </TabsTrigger>
                    </Link>
                ))}
            </TabsList>
        </Tabs>
      
      <Card className="print:hidden mb-6">
        <CardHeader>
            <CardTitle className="font-headline">Configurações de Cálculo</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label>Taxa de Retenção (%)</Label>
                <Input type="number" value={retentionRate} onChange={(e) => setRetentionRate(parseFloat(e.target.value) || 0)} />
            </div>
             <div className="space-y-2">
                <Label>Taxa INSS Trabalhador (%)</Label>
                <Input type="number" value={inssEmployeeRate} onChange={(e) => setInssEmployeeRate(parseFloat(e.target.value) || 0)} />
            </div>
             <div className="space-y-2">
                <Label>Taxa INSS Empresa (%)</Label>
                <Input type="number" value={8} disabled />
                 <p className="text-xs text-muted-foreground">Valor fixo de 8%.</p>
            </div>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <CardTitle className="font-headline">Gerar Guia de Pagamento</CardTitle>
                <CardDescription>
                    Selecione um serviço para preencher automaticamente os trabalhadores.
                </CardDescription>
            </div>
             <div className="space-y-2 w-full md:w-auto md:min-w-[250px]">
                <Label>Selecionar Serviço</Label>
                 <Select onValueChange={handleServiceChange} disabled={servicesLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder={servicesLoading ? "A carregar serviços..." : "Selecione um serviço..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {servicesLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : (
                            services?.filter(s => s.status === 'Aprovado' || s.status === 'Ativo').map(service => (
                                <SelectItem key={service.id} value={service.id}>
                                    {service.client} - {service.guideNumber}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='min-w-[200px]'>Nome</TableHead>
                      <TableHead className='min-w-[120px]'>Nº Dias</TableHead>
                      <TableHead className='min-w-[150px]'>Valor Dia</TableHead>
                      <TableHead className='min-w-[180px]'>Total Bruto</TableHead>
                      <TableHead className='min-w-[180px]'>INSS ({inssEmployeeRate}%)</TableHead>
                      <TableHead className='min-w-[180px]'>IRT</TableHead>
                      <TableHead className='min-w-[180px]'>Retenção ({retentionRate}%)</TableHead>
                      <TableHead className='min-w-[180px] font-bold'>Total Líquido</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={10} className='text-center py-10 text-muted-foreground'>
                                {servicesLoading ? 'A carregar...' : 'Selecione um serviço para ver os trabalhadores alocados.'}
                            </TableCell>
                        </TableRow>
                    ) : fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField control={form.control} name={`workers.${index}.name`} render={({ field }) => ( <FormItem><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </TableCell>
                         <TableCell>
                             <FormField control={form.control} name={`workers.${index}.daysWorked`} render={({ field }) => ( <FormItem><FormControl><Input type="number" {...field} onChange={(e) => handleValueChange(index, 'daysWorked', parseFloat(e.target.value) || 0)} /></FormControl></FormItem>)} />
                        </TableCell>
                         <TableCell>
                           <FormField control={form.control} name={`workers.${index}.dailyValue`} render={({ field }) => ( <FormItem><FormControl><Input type="number" {...field} onChange={(e) => handleValueChange(index, 'dailyValue', parseFloat(e.target.value) || 0)} /></FormControl></FormItem>)} />
                        </TableCell>
                        <TableCell className="font-medium">
                           {numberFormat(calculatedValues[index]?.grossTotal || 0)}
                        </TableCell>
                         <TableCell className="font-medium text-destructive">
                           -{numberFormat(calculatedValues[index]?.inss || 0)}
                        </TableCell>
                         <TableCell className="font-medium text-destructive">
                           -{numberFormat(calculatedValues[index]?.irt || 0)}
                        </TableCell>
                        <TableCell className="font-medium text-destructive">
                           -{numberFormat(calculatedValues[index]?.retention || 0)}
                        </TableCell>
                         <TableCell className="font-bold text-primary">
                           {numberFormat(calculatedValues[index]?.netTotal || 0)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={addNewWorker}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Trabalhador
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="print-only">
        <PaymentGuidePrintLayout 
          service={selectedService} 
          workers={watchWorkers} 
          calculatedValues={calculatedValues} 
          rates={{ retentionRate, inssEmployeeRate }}
        />
      </div>
    </>
  );
}
