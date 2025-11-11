
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
import { ClientDialog } from '@/components/dashboard/client-dialog';
import { useClients } from '@/hooks/use-clients';

export interface Client {
  id: string;
  name: string;
  nif: string;
  address: string;
  province: string;
  country: string;
  email?: string;
  phone?: string;
}

export default function ClientsPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const { clients, loading } = useClients();
    
    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedClient(null);
        setDialogOpen(true);
    }

  return (
    <>
      <DashboardHeader title="Gestão de Clientes">
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cliente
        </Button>
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Base de Dados de Clientes</CardTitle>
          <CardDescription>
            Gira a informação de todos os seus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Cliente</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Email de Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                </TableRow>
              ) : clients && clients.length > 0 ? (
                clients.map((client) => (
                    <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.nif}</TableCell>
                    <TableCell>{client.email || 'N/A'}</TableCell>
                    <TableCell>{client.phone || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(client)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
               ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum cliente registado.
                    </TableCell>
                </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
      />
    </>
  );
}
