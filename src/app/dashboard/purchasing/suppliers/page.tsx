
'use client';

import { useState, useEffect } from 'react';
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
import { getSupabaseClient } from '@/lib/supabase/client';
import { SupplierDialog, type SupplierFormValues } from '@/components/dashboard/purchasing/supplier-dialog';
import { useToast } from '@/hooks/use-toast';

export interface Supplier extends SupplierFormValues {
    id: string;
}

export default function PurchaseSuppliersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function fetchSuppliers() {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        const normalized = (data || []).map((s: any) => ({
          id: s.id,
          name: s.name || '',
          nif: s.nif || '',
          contactEmail: s.contact_email || '',
          phone: s.phone || '',
          address: s.address || '',
          city: s.city || '',
          country: s.country || '',
          postalCode: s.postal_code || '',
          website: s.website || '',
          notes: s.notes || '',
        }));
        
        if (isMounted) setSuppliers(normalized);
      } catch (err) {
        console.error('Erro ao carregar fornecedores do Supabase:', err);
        toast({ 
          title: 'Erro', 
          description: 'Não foi possível carregar os fornecedores.', 
          variant: 'destructive' 
        });
        if (isMounted) setSuppliers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSuppliers();
    return () => { isMounted = false; };
  }, [toast]);

  const refreshSuppliers = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const normalized = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name || '',
        nif: s.nif || '',
        contactEmail: s.contact_email || '',
        phone: s.phone || '',
        address: s.address || '',
        city: s.city || '',
        country: s.country || '',
        postalCode: s.postal_code || '',
        website: s.website || '',
        notes: s.notes || '',
      }));
      
      setSuppliers(normalized);
    } catch (err) {
      console.error('Erro ao recarregar fornecedores:', err);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível recarregar os fornecedores.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
  };
  
  const handleEdit = (supplier: Supplier) => {
    console.log('Editing supplier:', supplier);
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    console.log('Dialog close called, open:', open, 'selectedSupplier:', selectedSupplier);
    setDialogOpen(open);
    // Refresh suppliers list when dialog closes after editing/adding
    if (!open) {
      console.log('Refreshing suppliers list...');
      setSelectedSupplier(null);
      refreshSuppliers();
    }
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                    >
                      Editar
                    </Button>
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
        onOpenChange={handleDialogClose}
        supplier={selectedSupplier}
      />
    </>
  );
}
