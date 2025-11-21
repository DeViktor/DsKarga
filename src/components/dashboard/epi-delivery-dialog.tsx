
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Worker } from '@/types/worker';
import { Loader2, Truck, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useEpiItems, type EpiItem } from '@/hooks/use-epis';
import { type EpiDelivery } from '@/app/dashboard/epi/deliveries/page';
import { getSupabaseClient } from '@/lib/supabase/client';

interface EpiDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  epis: EpiItem[];
  onDeliverySuccess: (delivery: EpiDelivery) => void;
}

const deliverySchema = z.object({
  workerId: z.string().min(1, 'Selecione um trabalhador.'),
  epiId: z.string().min(1, 'Selecione um EPI.'),
  quantity: z.coerce.number().min(1, 'A quantidade deve ser pelo menos 1.'),
});

type DeliveryFormValues = z.infer<typeof deliverySchema>;

export function EpiDeliveryDialog({ open, onOpenChange, workers, epis, onDeliverySuccess }: EpiDeliveryDialogProps) {
  const { toast } = useToast();
  const { updateEpi } = useEpiItems();
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryFormValues & { workerName: string, epiName: string } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      workerId: '',
      epiId: '',
      quantity: 1,
    },
  });

  const selectedEpiId = form.watch('epiId');
  const selectedEpi = epis.find(e => e.id === selectedEpiId);
  const maxQuantity = selectedEpi?.quantity ?? 0;

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  const onSubmit = async (data: DeliveryFormValues) => {
    try {
      const selectedWorker = workers.find((w) => w.id === data.workerId);
      
      if (!selectedWorker || !selectedEpi) {
          toast({ title: 'Erro', description: 'Trabalhador ou EPI inválido.', variant: 'destructive'});
          return;
      }

      if (data.quantity > selectedEpi.quantity) {
          form.setError('quantity', { message: `Quantidade excede o stock. Disponível: ${selectedEpi.quantity}` });
          return;
      }

      const newQuantity = selectedEpi.quantity - data.quantity;
      await updateEpi(selectedEpi.id, { ...selectedEpi, quantity: newQuantity });
      
      const deliveryRecord: EpiDelivery = {
        id: `delivery-${Date.now()}`,
        ...data,
        workerName: selectedWorker.name,
        epiName: selectedEpi.name,
        date: new Date(),
        responsible: 'Admin'
      };
      
      const supabase = getSupabaseClient();
      const { data: inserted, error } = await supabase
        .from('epi_deliveries')
        .insert({
          worker_id: deliveryRecord.workerId,
          worker_name: deliveryRecord.workerName,
          epi_id: deliveryRecord.epiId,
          epi_name: deliveryRecord.epiName,
          quantity: deliveryRecord.quantity,
          delivery_date: deliveryRecord.date.toISOString().split('T')[0], // Use delivery_date and format as date only
          responsible: deliveryRecord.responsible,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      
      // Update the delivery record with the actual database ID
      deliveryRecord.id = inserted?.id || deliveryRecord.id;

      onDeliverySuccess(deliveryRecord);

      toast({
        title: 'Entrega Registada!',
        description: `${data.quantity}x ${selectedEpi.name} entregue(s) a ${selectedWorker.name}. Stock atualizado.`,
      });
      setDeliveryDetails(deliveryRecord);
    } catch (err) {
      console.error('Erro ao processar entrega de EPI', err);
      console.error('Error details:', err instanceof Error ? err.message : String(err));
      toast({ 
        title: 'Erro ao registar entrega', 
        description: err instanceof Error ? err.message : 'Erro desconhecido ao registar entrega',
        variant: 'destructive'
      });
      throw err;
    }
  };
  
  const handleClose = () => {
    setDeliveryDetails(null);
    form.reset({ workerId: '', epiId: '', quantity: 1 });
    onOpenChange(false);
  };
  
  const handlePrint = () => {
    setIsPrinting(true);
  };
  
  const PrintContent = () => deliveryDetails ? (
     <div className='pt-8'>
        <DialogHeader>
            <DialogTitle className="font-headline text-center text-2xl">Termo de Entrega de EPI</DialogTitle>
            <DialogDescription className='text-center'>Nº {new Date(deliveryDetails.date).getTime()}</DialogDescription>
        </DialogHeader>
        <div className="my-8 space-y-4 text-sm">
            <p>Eu, <span className='font-bold'>{deliveryDetails.workerName}</span>, declaro ter recebido da empresa DS KARGA SISTEM o(s) seguinte(s) equipamento(s) de proteção individual:</p>
            <div className='p-4 border rounded-md bg-muted/50'>
                <div className="flex justify-between font-medium">
                    <span>Equipamento</span>
                    <span>{deliveryDetails.epiName}</span>
                </div>
                <div className="flex justify-between font-medium">
                    <span>Quantidade</span>
                    <span>{deliveryDetails.quantity}</span>
                </div>
                 <div className="flex justify-between font-medium">
                    <span>Data</span>
                    <span>{format(deliveryDetails.date, 'dd/MM/yyyy')}</span>
                </div>
            </div>
            <p>Comprometo-me a utilizá-lo(s) corretamente durante o exercício das minhas funções, a zelar pela sua conservação e a devolvê-lo(s) quando solicitado.</p>
        </div>

         <div className="mt-16 pt-8">
            <div className="w-full h-12 border-b"></div>
            <p className="text-center text-sm mt-2">Assinatura do Trabalhador</p>
        </div>
        
        <DialogFooter className="mt-8 print:hidden">
            <Button type="button" variant="outline" onClick={handleClose}>Fechar</Button>
            <Button type="button" onClick={handlePrint}><FileText className="mr-2 h-4 w-4" /> Imprimir</Button>
        </DialogFooter>
    </div>
  ) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md print:shadow-none print:border-none">
          {deliveryDetails ? (
            <PrintContent />
          ) : (
          <>
              <DialogHeader>
              <DialogTitle className="font-headline">Registar Entrega de EPI</DialogTitle>
              <DialogDescription>
                  Selecione o trabalhador, o equipamento e a quantidade.
              </DialogDescription>
              </DialogHeader>
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                  control={form.control}
                  name="workerId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Trabalhador</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione um trabalhador" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {workers.map(worker => (
                              <SelectItem key={worker.id} value={worker.id}>{worker.name}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="epiId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Equipamento (EPI)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione um equipamento" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {epis.filter(e => e.quantity > 0).map(epi => (
                              <SelectItem key={epi.id} value={epi.id}>{epi.name} ({epi.quantity} em stock)</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                          <Input type="number" {...field} max={maxQuantity} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Registar e Gerar Termo
                      </Button>
                  </DialogFooter>
              </form>
              </Form>
          </>
          )}
        </DialogContent>
      </Dialog>
      <div className="hidden print-only">
        {isPrinting && <PrintContent />}
      </div>
    </>
  );
}
