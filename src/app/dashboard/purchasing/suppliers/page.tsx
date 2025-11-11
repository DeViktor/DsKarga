
'use client';

import { useState, useMemo } from 'react';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { SupplierDialog, type SupplierFormValues } from '@/components/dashboard/purchasing/supplier-dialog';

export interface Supplier extends SupplierFormValues {
    id: string;
}

export default function PurchaseSuppliersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const firestore = useFirestore();
  const suppliersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'suppliers'), orderBy('name'))
  }, [firestore]);
  
  const { data: suppliers, loading } = useCollection<Supplier>(suppliersQuery);

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
  };
  
  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  return (
    <>
      <DashboardHeader title="Fornecedores">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Fornecedor
        </Button>
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Base de Dados de Fornecedores</CardTitle>
          <CardDescription>
            Gestão de todos os fornecedores de produtos e serviços.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Fornecedor</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Email de Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
              ) : suppliers?.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.nif}</TableCell>
                  <TableCell>{supplier.contactEmail}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(supplier)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem disabled>Ver Histórico de Compras</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" disabled>Remover</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && suppliers?.length === 0 && (
                 <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum fornecedor encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SupplierDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
      />
    </>
  );
}
