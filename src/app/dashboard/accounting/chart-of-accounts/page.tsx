
'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, PlusCircle, MoreHorizontal, Loader2, Trash2, Edit } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Supabase integration replaces Firebase for listing PGC accounts
import { getSupabaseClient } from '@/lib/supabase/client';
import { AccountDialog } from '@/components/dashboard/accounting/account-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { pgcAccounts as staticAccounts } from '@/lib/pgc-data';
 

export interface PGCAccount {
  id: string;
  code: string;
  name: string;
  class: string;
  isCustom?: boolean;
}


export default function ChartOfAccountsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PGCAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<PGCAccount | null>(null);
  const [supabaseAccounts, setSupabaseAccounts] = useState<PGCAccount[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  useEffect(() => {
    let isMounted = true;
    async function fetchAccounts() {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('pgc_accounts')
          .select('*')
          .order('code', { ascending: true });

        if (error) {
          toast({
            title: 'Erro ao carregar PGC',
            description: error.message,
            variant: 'destructive',
          });
          if (isMounted) setSupabaseAccounts(null);
        } else if (data && isMounted) {
          const normalized: PGCAccount[] = (data as any[]).map((acc) => ({
            id: acc.id ?? acc.code,
            code: acc.code ?? acc.account_code ?? '',
            name: acc.name ?? acc.account_name ?? '',
            class: acc.class ?? acc.account_class ?? '',
            isCustom: false,
          })).filter(a => a.code && a.name && a.class);

          if (normalized.length === 0) {
            toast({
              title: 'Sem contas no Supabase',
              description: 'A tabela pgc_accounts está vazia. A mostrar dados estáticos do PGC.',
            });
          }
          setSupabaseAccounts(normalized);
        }
      } catch (e: any) {
        toast({
          title: 'Erro inesperado',
          description: e?.message ?? 'Falha ao carregar contas do Supabase.',
          variant: 'destructive',
        });
        if (isMounted) setSupabaseAccounts(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAccounts();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!dialogOpen) {
      let isMounted = true;
      (async () => {
        try {
          setLoading(true);
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('pgc_accounts')
            .select('*')
            .order('code', { ascending: true });
          if (!isMounted) return;
          if (error) {
            toast({ title: 'Erro ao carregar PGC', description: error.message, variant: 'destructive' });
            setSupabaseAccounts(null);
          } else if (data) {
            const normalized: PGCAccount[] = (data as any[]).map((acc) => ({
              id: acc.id ?? acc.code,
              code: acc.code ?? acc.account_code ?? '',
              name: acc.name ?? acc.account_name ?? '',
              class: acc.class ?? acc.account_class ?? '',
              isCustom: false,
            })).filter(a => a.code && a.name && a.class);
            setSupabaseAccounts(normalized);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      })();
      return () => { isMounted = false; };
    }
  }, [dialogOpen]);

  const allAccounts = useMemo(() => {
    const source = supabaseAccounts && supabaseAccounts.length > 0 ? supabaseAccounts : staticAccounts;
    return [...source].sort((a, b) => a.code.localeCompare(b.code));
  }, [supabaseAccounts]);


  const filteredAccounts = useMemo(() => {
    if (!allAccounts) return [];
    return allAccounts.filter(
      (account) =>
        account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allAccounts, searchTerm]);
  
  const getClassBadge = (accountClass: string) => {
    if (accountClass.includes('Custos')) {
        return <Badge variant="destructive" className="bg-red-100 text-red-800">{accountClass}</Badge>;
    }
    if (accountClass.includes('Proveitos')) {
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{accountClass}</Badge>;
    }
    if (accountClass.includes('Activo')) {
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{accountClass}</Badge>;
    }
     if (accountClass.includes('Capital Próprio')) {
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">{accountClass}</Badge>;
    }
    if (accountClass.includes('Resultados')) {
        return <Badge variant="default">{accountClass}</Badge>;
    }
    return <Badge variant="outline">{accountClass}</Badge>;
  };
  
  const handleEdit = (account: PGCAccount) => {
    setSelectedAccount(account);
    setDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedAccount(null);
    setDialogOpen(true);
  };

  const openDeleteDialog = (account: PGCAccount) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!accountToDelete) return;
    toast({
      title: 'Operação não disponível',
      description: 'A eliminação está apenas disponível para contas personalizadas.',
    });
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  }


  return (
    <>
      <DashboardHeader title="Plano de Contas (PGC Angolano)">
        <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Conta</Button>
      </DashboardHeader>
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Lista de Contas PGC</CardTitle>
            <CardDescription>
                Lista de contas oficial para classificação de operações contabilísticas.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar por código ou nome..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[150px]">Código</TableHead>
                        <TableHead>Designação</TableHead>
                        <TableHead>Classe</TableHead>
                        <TableHead className="w-[50px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : filteredAccounts.map((account) => (
                        <TableRow key={account.id}>
                            <TableCell className="font-mono">{account.code}</TableCell>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell>{getClassBadge(account.class)}</TableCell>
                            <TableCell className="text-right">
                                {account.isCustom ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(account)}>
                                                <Edit className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openDeleteDialog(account)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : null}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
      
      <AccountDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={selectedAccount}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isto irá eliminar permanentemente a conta <span className="font-bold">{accountToDelete?.name}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
