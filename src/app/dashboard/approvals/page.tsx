

'use client';

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";
import { terminationRequests } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";


const purchaseRequests = [
  { id: 'PR-001', department: 'Logística', requestedBy: 'Admin', date: '2024-07-29', amount: 150000, status: 'Pendente' },
];
const serviceRequests = [
    { id: 'SRV-004', client: 'Cliente D', requestedBy: 'Admin', date: '2024-07-15', workerCount: 15, status: 'Pendente', serviceId: 'SRV-004-ID' },
];

const payrolls = [
    { id: 'PAY-07-2024', period: 'Julho 2024', totalAmount: 15480000, status: 'Pendente de Aprovação Final' }
]


export default function ApprovalsPage() {
  return (
    <>
      <DashboardHeader title="Central de Aprovações" />
      <Tabs defaultValue="terminations">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="terminations">Desligamentos</TabsTrigger>
            <TabsTrigger value="purchases">Requisições de Compra</TabsTrigger>
            <TabsTrigger value="services">Requisições de Serviço</TabsTrigger>
            <TabsTrigger value="payroll">Folhas de Pagamento</TabsTrigger>
        </TabsList>
        <TabsContent value="terminations">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline">Aprovação de Desligamentos</CardTitle>
                <CardDescription>
                    Reveja e aprove ou rejeite os pedidos de desligamento de trabalhadores.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Trabalhador</TableHead>
                        <TableHead>Data do Pedido</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {terminationRequests.map((request) => (
                        <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.workerName}</TableCell>
                        <TableCell>{request.requestDate}</TableCell>
                        <TableCell>{request.reason}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant="secondary">{request.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                             <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/workers/${request.workerId}/termination`}><Eye className="mr-2 h-4 w-4" /> Ver</Link>
                            </Button>
                            <Button variant="outline" size="sm">
                            <X className="mr-2 h-4 w-4" /> Rejeitar
                            </Button>
                            <Button size="sm">
                            <Check className="mr-2 h-4 w-4" /> Aprovar
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    {terminationRequests.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                Não existem aprovações de desligamento pendentes.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="purchases">
             <Card>
                <CardHeader>
                <CardTitle className="font-headline">Aprovação de Requisições de Compra</CardTitle>
                <CardDescription>
                    Reveja e aprove ou rejeite as solicitações de compra.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nº Solicitação</TableHead>
                                <TableHead>Departamento</TableHead>
                                <TableHead>Requisitante</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Valor Estimado</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {purchaseRequests.map((request) => (
                                <TableRow key={request.id}>
                                <TableCell className="font-mono">{request.id}</TableCell>
                                <TableCell>{request.department}</TableCell>
                                <TableCell className="font-medium">{request.requestedBy}</TableCell>
                                <TableCell>{request.date}</TableCell>
                                <TableCell>{request.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</TableCell>
                                <TableCell className="text-right space-x-2">
                                     <Button variant="outline" size="sm" disabled>
                                        <Eye className="mr-2 h-4 w-4" /> Ver
                                    </Button>
                                    <Button variant="outline" size="sm">
                                    <X className="mr-2 h-4 w-4" /> Rejeitar
                                    </Button>
                                    <Button size="sm">
                                    <Check className="mr-2 h-4 w-4" /> Aprovar
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                             {purchaseRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        Não existem requisições de compra pendentes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="services">
             <Card>
                <CardHeader>
                <CardTitle className="font-headline">Aprovação de Requisições de Serviço</CardTitle>
                <CardDescription>
                    Reveja e aprove ou rejeite as solicitações de mão de obra.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nº Requisição</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Nº Pessoal</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {serviceRequests.map((request) => (
                                <TableRow key={request.id}>
                                <TableCell className="font-mono">{request.id}</TableCell>
                                <TableCell className="font-medium">{request.client}</TableCell>
                                <TableCell>{request.date}</TableCell>
                                <TableCell>{request.workerCount}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/dashboard/services/${request.serviceId}`}><Eye className="mr-2 h-4 w-4" /> Ver</Link>
                                    </Button>
                                    <Button variant="outline" size="sm">
                                    <X className="mr-2 h-4 w-4" /> Rejeitar
                                    </Button>
                                    <Button size="sm">
                                    <Check className="mr-2 h-4 w-4" /> Aprovar
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                             {serviceRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        Não existem requisições de serviço pendentes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="payroll">
             <Card>
                <CardHeader>
                <CardTitle className="font-headline">Aprovação de Folha de Pagamento</CardTitle>
                <CardDescription>
                    Reveja e aprove as folhas de pagamento antes do processamento final.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Período</TableHead>
                                <TableHead>Valor Total</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrolls.map((payroll) => (
                                <TableRow key={payroll.id}>
                                <TableCell className="font-medium">{payroll.period}</TableCell>
                                <TableCell>{payroll.totalAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</TableCell>
                                <TableCell><Badge variant="secondary">{payroll.status}</Badge></TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm">
                                        Ver Detalhes
                                    </Button>
                                    <Button size="sm">
                                    <Check className="mr-2 h-4 w-4" /> Aprovar Folha
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                             {payrolls.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        Não existem folhas de pagamento pendentes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
