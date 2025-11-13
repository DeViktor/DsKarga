
'use client';

import { useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, ArrowUpDown, Search, PackagePlus, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { EpiItemDialog } from '@/components/dashboard/epi-item-dialog';
import { EpiStockEntryDialog } from '@/components/dashboard/epi-stock-entry-dialog';
import { useEpiItems, type EpiItem } from '@/hooks/use-epis';


export default function EpiInventoryPage() {
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EpiItem | null>(null);
  
  const { epis, loading: episLoading, updateEpi, addEpi } = useEpiItems();
  
  const getStockStatus = (item: EpiItem) => {
    if (item.quantity === 0) {
      return <Badge variant="destructive">Fora de Estoque</Badge>;
    }
    if (item.quantity <= item.lowStockThreshold) {
      return <Badge variant="secondary">Estoque Baixo</Badge>;
    }
    return <Badge>Em Estoque</Badge>;
  };
  
  const handleAddNewItem = () => {
    setSelectedItem(null);
    setItemDialogOpen(true);
  }

  const handleEditItem = (item: EpiItem) => {
    setSelectedItem(item);
    setItemDialogOpen(true);
  }

  return (
    <>
      <DashboardHeader title="Inventário de EPIs e Materiais">
        <p className="text-sm text-muted-foreground hidden lg:block">Lista de todos os itens em estoque.</p>
        <div className='flex-1' />
        <Button variant="outline" onClick={() => setStockDialogOpen(true)}><PackagePlus className="mr-2 h-4 w-4" /> Entrada em Estoque</Button>
        <Button onClick={handleAddNewItem}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Item</Button>
      </DashboardHeader>

      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                     <Select defaultValue="all">
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filtrar por Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="protecao-cabeca">Proteção de Cabeça</SelectItem>
                            <SelectItem value="protecao-ocular">Proteção Ocular</SelectItem>
                            <SelectItem value="protecao-respiratoria">Proteção Respiratória</SelectItem>
                        </SelectContent>
                    </Select>
                     <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Nome ou código..." className="pl-8" />
                    </div>
                </div>
                <Button variant="ghost">
                    Ordenar por Estoque (Desc)
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {episLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Estoque Atual</TableHead>
                  <TableHead className="text-center">Estoque Mín.</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className='text-center'>Estado</TableHead>
                  <TableHead className='text-right'>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {epis?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{item.lowStockThreshold}</TableCell>
                    <TableCell>{item.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                    <TableCell>{item.location || 'N/A'}</TableCell>
                    <TableCell className="text-center">{getStockStatus(item)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
        </CardContent>
      </Card>
      
      <EpiItemDialog 
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={selectedItem}
        onSave={selectedItem ? updateEpi : addEpi}
      />
      <EpiStockEntryDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        epis={epis || []}
        onSave={updateEpi}
       />
    </>
  );
}
