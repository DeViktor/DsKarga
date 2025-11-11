
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
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
import { deleteAccount } from '@/firebase/firestore/accounts';
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
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const customAccountsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'chart-of-accounts'), orderBy('code'));
  }, [firestore]);

  const { data: customAccounts, loading } = useCollection<PGCAccount>(customAccountsQuery);

  const allAccounts = useMemo(() => {
    const firestoreAccounts = customAccounts ? customAccounts.map(acc => ({ ...acc, isCustom: true })) : [];
    return [...staticAccounts, ...firestoreAccounts].sort((a, b) => a.code.localeCompare(b.code));
  }, [customAccounts]);


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
    if (!firestore || !accountToDelete) return;
    try {
        await deleteAccount(firestore, accountToDelete.id);
        toast({
            title: "Conta Eliminada",
            description: "A conta foi removida com sucesso.",
        });
    } catch (error) {
        toast({
            title: "Erro",
            description: "Não foi possível eliminar a conta.",
            variant: "destructive",
        });
    } finally {
        setDeleteDialogOpen(false);
        setAccountToDelete(null);
    }
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
