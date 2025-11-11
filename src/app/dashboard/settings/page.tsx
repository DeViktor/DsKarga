
'use client';

import { useState } from 'react';
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, UserPlus, Shield, Check } from "lucide-react";
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const navItems = [
    { href: '/dashboard', label: 'Painel' },
    { href: '/dashboard/workers', label: 'Trabalhadores' },
    { 
      label: 'Serviços',
      subItems: [
          { href: '/dashboard/services', label: 'Gestão de Serviços' },
          { href: '/dashboard/services/new', label: 'Nova Requisição' },
          { href: '/dashboard/services/payment-guide', label: 'Guias de Pagamento' },
      ]
    },
    { 
      label: 'Gestão de Compras',
      subItems: [
          { href: '/dashboard/purchasing', label: 'Dashboard' },
          { href: '/dashboard/purchasing/requests', label: 'Solicitações' },
          { href: '/dashboard/purchasing/orders', label: 'Ordens de Compra' },
          { href: '/dashboard/purchasing/suppliers', label: 'Fornecedores' },
      ]
    },
    { 
      label: 'Gestão de EPI',
      subItems: [
          { href: '/dashboard/epi', label: 'Inventário EPI' },
          { href: '/dashboard/epi/deliveries', label: 'Entregas EPI' },
          { href: '/dashboard/epi/suppliers', label: 'Fornecedores EPI' },
      ]
    },
    { href: '/dashboard/attendance', label: 'Assiduidade' },
    { href: '/dashboard/payroll', label: 'Folha de Pagamento'},
    { href: '/dashboard/accidents', label: 'Acidentes' },
    { 
      label: 'Gestão Financeira',
      subItems: [
          { href: '/dashboard/finance', label: 'Dashboard' },
          { href: '/dashboard/billing', label: 'Faturação' },
          { href: '/dashboard/bank-reconciliation', label: 'Conciliação Bancária' },
          { href: '/dashboard/accounts-payable-receivable', label: 'Contas a Pagar/Receber' },
          { href: '/dashboard/cash-flow', label: 'Fluxo de Caixa' },
          { href: '/dashboard/kpi-analysis', label: 'Análise de KPIs' },
          { href: '/dashboard/ai-analysis', label: 'Análise com IA' },
          { href: '/dashboard/financial-statements', label: 'Demonstrações' },
      ]
    },
    { 
      label: 'Gestão Contabilística',
      subItems: [
          { href: '/dashboard/accounting', label: 'Dashboard' },
          { href: '/dashboard/accounting/chart-of-accounts', label: 'Plano de Contas' },
          { href: '/dashboard/accounting/journal', label: 'Lançamentos' },
      ]
    },
    { href: '/dashboard/candidates', label: 'Banco de Candidatos' },
    { href: '/dashboard/reports', label: 'Relatórios' },
    { href: '/dashboard/settings', label: 'Configurações' },
  ];
  
type Permission = {
    id: string;
    label: string;
    checked: boolean;
};

const users = [
    { id: 'user-1', name: 'Administrador', email: 'admin@dskarga.com', role: 'Admin' },
    { id: 'user-2', name: 'Helena Pinto', email: 'helena.pinto@dskarga.com', role: 'Gestor RH' },
]


export default function SettingsPage() {
    const [permissions, setPermissions] = useState<Permission[]>(
        navItems.flatMap(item => 
            item.subItems 
            ? [{ id: item.label, label: item.label, checked: false }, ...item.subItems.map(sub => ({ id: sub.href!, label: sub.label, checked: false }))]
            : [{ id: item.href!, label: item.label, checked: false }]
        )
    );

    const handleParentChange = (parentLabel: string, checked: boolean) => {
        const parentItem = navItems.find(item => item.label === parentLabel);
        if (!parentItem || !parentItem.subItems) return;
    
        const subItemIds = parentItem.subItems.map(sub => sub.href);
    
        setPermissions(prev => prev.map(p => 
          (p.id === parentLabel || subItemIds.includes(p.id)) ? { ...p, checked } : p
        ));
      };

    const handleChildChange = (id: string, checked: boolean) => {
        setPermissions(prev => prev.map(p => p.id === id ? { ...p, checked } : p));
    };


  return (
    <>
      <DashboardHeader title="Configurações" />
      <div className="max-w-4xl mx-auto grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Configurações Gerais</CardTitle>
                    <CardDescription>Gira as configurações globais da plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Faturação</h3>
                        <div className="space-y-2">
                            <Label htmlFor="daily-rate">Taxa Diária Padrão (Kz)</Label>
                            <Input id="daily-rate" type="number" defaultValue="8168.18" />
                            <p className="text-sm text-muted-foreground">Esta é a taxa padrão usada para gerar faturas.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Configuração de Impostos</h3>
                        <div className="space-y-2">
                            <Label htmlFor="inss-rate">Taxa INSS (%)</Label>
                            <Input id="inss-rate" type="number" defaultValue="3" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="irt-rate">Taxa IRT (%)</Label>
                            <Input id="irt-rate" type="number" defaultValue="10" />
                        </div>
                    </div>
                    
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Aviso</AlertTitle>
                        <AlertDescription>
                            As alterações feitas aqui afetarão todos os cálculos futuros. Por favor, proceda com cautela.
                        </AlertDescription>
                    </Alert>

                    <div className="flex justify-end">
                        <Button>Guardar Configurações</Button>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Gestão de Utilizadores</CardTitle>
                        <CardDescription>Adicione, remova e gira as permissões dos utilizadores.</CardDescription>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button><UserPlus className="mr-2"/>Adicionar Utilizador</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                             <DialogHeader>
                                <DialogTitle className="font-headline">Adicionar Novo Utilizador</DialogTitle>
                                <DialogDescription>Preencha os dados e defina as permissões de acesso.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className='grid grid-cols-2 gap-4'>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome Completo</Label>
                                        <Input id="name" placeholder="Nome do utilizador" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" placeholder="email@dskarga.com" />
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Shield className="h-4 w-4" /> Permissões de Acesso</Label>
                                    <div className="max-h-60 overflow-y-auto space-y-4 rounded-md border p-4">
                                        {navItems.map(item => {
                                            if (item.subItems) {
                                                const parentPermission = permissions.find(p => p.id === item.label);
                                                return (
                                                    <div key={item.label} className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={item.label}
                                                                checked={parentPermission?.checked}
                                                                onCheckedChange={(checked) => handleParentChange(item.label, !!checked)}
                                                            />
                                                            <label htmlFor={item.label} className="text-sm font-bold leading-none">{item.label}</label>
                                                        </div>
                                                        <div className="pl-6 space-y-2">
                                                            {item.subItems.map(sub => {
                                                                const subPermission = permissions.find(p => p.id === sub.href);
                                                                return (
                                                                <div key={sub.href} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={sub.href}
                                                                        checked={subPermission?.checked}
                                                                        onCheckedChange={(checked) => handleChildChange(sub.href!, !!checked)}
                                                                    />
                                                                    <label htmlFor={sub.href} className="text-sm leading-none text-muted-foreground">{sub.label}</label>
                                                                </div>
                                                            )})}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            const singlePermission = permissions.find(p => p.id === item.href);
                                            return (
                                                <div key={item.href} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={item.href}
                                                        checked={singlePermission?.checked}
                                                        onCheckedChange={(checked) => handleChildChange(item.href!, !!checked)}
                                                    />
                                                    <label htmlFor={item.href} className="text-sm font-bold leading-none">{item.label}</label>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                <Button><Check className="mr-2"/>Criar Utilizador</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilizador</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Perfil</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {user.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
