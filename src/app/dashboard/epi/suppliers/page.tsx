
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
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { EpiSupplierDialog } from '@/components/dashboard/epi-supplier-dialog';
import { useEpiSuppliers, type EpiSupplier } from '@/hooks/use-epi-suppliers';

export default function EpiSuppliersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<EpiSupplier | null>(null);
  
  const { suppliers, loading, addSupplier, updateSupplier } = useEpiSuppliers();

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
  }

  const handleEdit = (supplier: EpiSupplier) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  }

  return (
    <>
      <DashboardHeader title="Fornecedores">
         <p className="text-sm text-muted-foreground hidden lg:block">Base de dados de fornecedores de EPIs e outros materiais.</p>
         <div className="flex-1"/>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Fornecedor
        </Button>
      </DashboardHeader>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pessoa de Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                    </TableRow>
                ) : suppliers?.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                           Nenhum fornecedor registado.
                        </TableCell>
                    </TableRow>
                ) : suppliers?.map(supplier => (
                    <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.category}</TableCell>
                        <TableCell>{supplier.contactPerson || 'N/A'}</TableCell>
                        <TableCell>{supplier.phone || 'N/A'}</TableCell>
                        <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>Editar</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <EpiSupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
        onSave={selectedSupplier ? updateSupplier : addSupplier}
      />
    </>
  );
}
