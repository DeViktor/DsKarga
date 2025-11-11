
'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Truck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EpiDeliveryDialog } from '@/components/dashboard/epi-delivery-dialog';
import { format } from 'date-fns';
import { useWorkers } from '@/hooks/use-workers';
import { type Worker } from '@/app/dashboard/workers/page';
import { EpiItem, useEpiItems } from '@/hooks/use-epis';


export interface EpiDelivery {
  id: string;
  workerId: string;
  workerName: string;
  epiId: string;
  epiName: string;
  quantity: number;
  date: Date;
  responsible: string; 
}


export default function EpiDeliveriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { workers, loading: workersLoading } = useWorkers();
  const { epis, loading: episLoading } = useEpiItems();
  const [deliveries, setDeliveries] = useState<EpiDelivery[]>([]);

  const isLoading = workersLoading || episLoading;
  
  const addDeliveryToHistory = (delivery: EpiDelivery) => {
    setDeliveries(prev => [delivery, ...prev]);
  };

  return (
    <>
      <DashboardHeader title="Registo de Entregas">
         <p className="text-sm text-muted-foreground hidden lg:block">Histórico de entregas de material aos colaboradores.</p>
         <div className='flex-1' />
         <Button variant="outline" onClick={() => setDialogOpen(true)}><Truck className="mr-2 h-4 w-4"/> Registo de Entrega</Button>
      </DashboardHeader>
      
      <EpiDeliveryDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        workers={(workers as Worker[]) || []} 
        epis={epis || []}
        onDeliverySuccess={addDeliveryToHistory}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Histórico de Entregas</CardTitle>
          <CardDescription>
              Registo de todos os EPIs entregues aos trabalhadores.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Itens Entregues</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {deliveries?.map((delivery) => (
                      <TableRow key={delivery.id}>
                          <TableCell>{format(delivery.date, 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-medium">{delivery.workerName}</TableCell>
                          <TableCell>{delivery.quantity}x {delivery.epiName}</TableCell>
                          <TableCell>{delivery.responsible || 'Admin'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                                <FileText className="mr-2 h-3 w-3" /> Termo
                            </Button>
                          </TableCell>
                      </TableRow>
                  ))}
                   {deliveries?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                Nenhuma entrega registada.
                            </TableCell>
                        </TableRow>
                    )}
              </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
