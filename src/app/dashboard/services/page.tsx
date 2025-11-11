

'use client';

import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Search, List, LayoutGrid, Users, Calendar, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useServices, type Service } from "@/hooks/use-services";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";

const servicesNav = [
    { name: "Gestão de Serviços", href: "/dashboard/services" },
    { name: "Novo Serviço", href: "/dashboard/services/new" },
    { name: "Guias de Pagamento", href: "/dashboard/services/payment-guide" },
];

export default function ServicesPage() {
  const pathname = usePathname();
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const { services, loading } = useServices();

  const fixedContracts = useMemo(() => services?.filter(s => s.type === 'Contrato Fixo') || [], [services]);
  const eventualServices = useMemo(() => services?.filter(s => s.type === 'Eventual (Requisição)') || [], [services]);

  const getStatusVariant = (status: Service['status']) => {
    switch (status) {
        case 'Ativo': return 'default';
        case 'Concluído': return 'secondary';
        case 'Suspenso': return 'destructive';
        case 'Pendente': return 'outline';
        default: return 'outline';
    }
  }

  const renderGrid = (title: string, data: Service[]) => (
    <div className="space-y-4">
        <h2 className="font-headline text-xl font-semibold">{title}</h2>
        {data.length === 0 ? (
             <p className="text-muted-foreground text-sm">Nenhum serviço deste tipo encontrado.</p>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.map((service) => (
                <Card key={service.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-base font-bold">{service.client}</CardTitle>
                            <CardDescription>{service.type}</CardDescription>
                        </div>
                            <Badge variant={getStatusVariant(service.status)}>
                                {service.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="text-sm text-muted-foreground space-y-2">
                            <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4"/>
                            <span>Início: {format(service.requestDate.toDate(), "dd/MM/yyyy", { locale: pt })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                            <Users className="h-4 w-4"/>
                            <span>{service.assignedWorkers?.length || 0} Pessoas Alocadas</span>
                            </div>
                            <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4"/>
                            <span>{service.budget ? service.budget.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' }) : 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href={`/dashboard/services/${service.id}`}>Ver Detalhes</Link>
                        </Button>
                    </CardFooter>
                </Card>
                ))}
            </div>
        )}
    </div>
  );

  const renderTable = (title: string, data: Service[]) => (
    <div className="space-y-4">
        <h2 className="font-headline text-xl font-semibold">{title}</h2>
         {data.length === 0 ? (
             <p className="text-muted-foreground text-sm">Nenhum serviço deste tipo encontrado.</p>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Nº Guia/Ref</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pessoal Alocado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((service) => (
                    <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.client}</TableCell>
                        <TableCell className="font-mono">{service.guideNumber}</TableCell>
                        <TableCell>
                        {format(service.requestDate.toDate(), "dd/MM/yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(service.status)}>
                                {service.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{service.assignedWorkers?.length || 0}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                            <Link href={`/dashboard/services/${service.id}`}>Ver Detalhes</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Aprovar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Rejeitar</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
    </div>
  );


  const renderContent = () => {
    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-muted-foreground"/></div>;
    }

    if (!services || services.length === 0) {
        return <div className="text-center text-muted-foreground py-16">Nenhuma requisição de serviço encontrada.</div>
    }

    if (view === 'list') {
        return (
            <div className="space-y-8">
                {renderTable("Contratos Fixos", fixedContracts)}
                <Separator />
                {renderTable("Serviços Eventuais (Requisições)", eventualServices)}
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {renderGrid("Contratos Fixos", fixedContracts)}
            <Separator />
            {renderGrid("Serviços Eventuais (Requisições)", eventualServices)}
        </div>
    )
  }

  return (
    <>
      <DashboardHeader title="Serviços">
        <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Procurar serviços..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
        <div className="flex items-center gap-2">
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}>
                <List className="h-4 w-4" />
                <span className="sr-only">Lista</span>
            </Button>
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}>
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grelha</span>
            </Button>
        </div>
      </DashboardHeader>
      
       <Tabs value={pathname} className="w-full mb-6">
            <TabsList>
                {servicesNav.map((item) => (
                     <Link key={item.name} href={item.href} passHref>
                        <TabsTrigger value={item.href}>
                            {item.name}
                        </TabsTrigger>
                    </Link>
                ))}
            </TabsList>
        </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Gestão de Requisições e Contratos</CardTitle>
          <CardDescription>
            Acompanhe os contratos fixos e as requisições de mão de obra para todos os clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </>
  );
}
