
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase/client';

const requestItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  quantity: z.coerce.number().min(1, 'Quantidade deve ser maior que 0.'),
  unit: z.string().min(1, 'Unidade é obrigatória.'),
});

const purchaseRequestSchema = z.object({
  requester: z.string().default('Admin'),
  department: z.string().min(1, 'Departamento é obrigatório.'),
  date: z.date({ required_error: 'Data é obrigatória.' }),
  justification: z.string().min(1, 'Justificação é obrigatória.'),
  items: z.array(requestItemSchema).min(1, 'Adicione pelo menos um item.'),
});

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestSchema>;

export default function PurchasingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      requester: 'Admin',
      date: new Date(),
      department: '',
      justification: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unit: '' });

  const handleAddItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.unit) {
        toast({ title: 'Item Incompleto', description: 'Preencha todos os campos para adicionar um item.', variant: 'destructive'});
        return
    };
    append({ ...newItem, id: `new-${Date.now()}` });
    setNewItem({ description: '', quantity: 1, unit: '' });
  };

  const onSubmit = async (data: PurchaseRequestFormValues) => {
    try {
      // Inline fallback: inserir solicitação diretamente no Supabase
      const supabase = getSupabaseClient();
      const requestNumber = `PR-${Date.now()}`;
      const payload = {
        request_number: requestNumber,
        requester: data.requester ?? 'Admin',
        department: data.department ?? '',
        request_date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        justification: data.justification ?? '',
        status: 'Pendente',
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('purchase_requests')
        .insert(payload);
      if (error) throw new Error(error.message || 'Falha ao criar solicitação de compra');
      toast({
        title: "Sucesso!",
        description: "A sua solicitação de compra foi enviada para aprovação.",
      });
      router.push('/dashboard/purchasing/requests');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Não foi possível submeter a solicitação.';
      toast({ title: "Erro", description: message, variant: "destructive"});
    }
  };


  return (
    <>
      <DashboardHeader title="Gestão de Compras">
        <p className="text-sm text-muted-foreground hidden lg:block">
          Centralize e otimize os processos de aquisição da sua empresa.
        </p>
      </DashboardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 md:grid-cols-2">
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">Nova Solicitação de Compra</CardTitle>
                <CardDescription>
                Preencha o formulário para submeter um novo pedido de compra para aprovação.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Requisitante</Label>
                    <Input defaultValue="Admin" disabled />
                </div>
                 <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel>Departamento</FormLabel>
                            <FormControl>
                               <Input placeholder="Ex: Logística" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                         <FormItem className="flex flex-col space-y-2">
                            <FormLabel>Data</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button variant={"outline"} className="justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, 'PPP') : <span>Selecione uma data</span>}
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="font-medium">Itens a Solicitar</h4>
                    <div className="grid grid-cols-12 gap-2">
                        <div className="space-y-2 col-span-6">
                            <Label>Descrição do item ou serviço</Label>
                            <Input value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Qtd.</Label>
                            <Input type="number" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-2 col-span-4">
                            <Label>Unidade</Label>
                            <Input placeholder="Ex: un, cx, kg" value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} />
                        </div>
                    </div>
                    <Button type="button" onClick={handleAddItem} size="sm" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item</Button>
                </div>
                
                 <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel htmlFor="justification">Justificação da Necessidade</FormLabel>
                             <FormControl>
                                <Textarea id="justification" placeholder="Descreva o motivo desta solicitação..." {...field} />
                             </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className='animate-spin mr-2' />}
                    Submeter Solicitação
                </Button>
            </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Itens da Solicitação</CardTitle>
                    <CardDescription>Rever os itens antes de submeter.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-center">Qtd.</TableHead>
                                <TableHead>Unidade</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum item adicionado.</TableCell>
                                </TableRow>
                            ): (
                                fields.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell className="text-right">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </form>
      </Form>
    </>
  );
}
