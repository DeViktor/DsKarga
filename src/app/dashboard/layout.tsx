
'use client';

import Link from 'next/link';
import {
  BarChart, Briefcase, CalendarCheck, FileText, Home, Settings, User, Users, Shield, Siren, Banknote, Landmark,
  LayoutDashboard, Book, FolderKanban, Scale, GanttChart, BrainCircuit, Receipt, GitBranch, Truck, Contact, Wallet, ShoppingCart, ClipboardCheck, Gavel
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/icons';
import { LogoutButton } from '@/components/logout-button';
import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/dashboard', icon: Home, label: 'Painel' },
  { 
    id: 'services',
    icon: Briefcase, 
    label: 'Serviços',
    subItems: [
        { href: '/dashboard/services', icon: LayoutDashboard, label: 'Gestão de Serviços' },
        { href: '/dashboard/services/new', icon: FileText, label: 'Novo Serviço' },
        { href: '/dashboard/services/payment-guide', icon: Wallet, label: 'Guias de Pagamento' },
    ]
  },
  { 
    id: 'supervision',
    icon: ClipboardCheck, 
    label: 'Supervisão',
    subItems: [
        { href: '/dashboard/supervision', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/supervision/new', icon: FileText, label: 'Criar Relatório' },
    ]
  },
  { href: '/dashboard/workers', icon: User, label: 'Trabalhadores' },
  { href: '/dashboard/approvals', icon: Gavel, label: 'Aprovações' },
  { 
    id: 'purchasing',
    icon: ShoppingCart, 
    label: 'Gestão de Compras',
    subItems: [
        { href: '/dashboard/purchasing', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/purchasing/requests', icon: FileText, label: 'Solicitações' },
        { href: '/dashboard/purchasing/orders', icon: Briefcase, label: 'Ordens de Compra' },
        { href: '/dashboard/purchasing/suppliers', icon: Contact, label: 'Fornecedores' },
    ]
  },
  { 
    id: 'epi',
    icon: Shield, 
    label: 'Gestão de EPI',
    subItems: [
        { href: '/dashboard/epi', icon: LayoutDashboard, label: 'Inventário EPI' },
        { href: '/dashboard/epi/deliveries', icon: Truck, label: 'Entregas EPI' },
        { href: '/dashboard/epi/suppliers', icon: Contact, label: 'Fornecedores EPI' },
    ]
  },
  { href: '/dashboard/attendance', icon: CalendarCheck, label: 'Assiduidade' },
  { href: '/dashboard/payroll', icon: Wallet, label: 'Folha de Pagamento'},
  { href: '/dashboard/accidents', icon: Siren, label: 'Acidentes' },
  { href: '/dashboard/billing', icon: FileText, label: 'Faturação' },
  { href: '/dashboard/cash-flow', icon: Landmark, label: 'Fluxo de Caixa' },
  { 
    id: 'accounting',
    icon: Book, 
    label: 'Gestão Contabilística',
    subItems: [
        { href: '/dashboard/accounting', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/accounting/journal', icon: Scale, label: 'Lançamentos' },
        { href: '/dashboard/accounting/chart-of-accounts', icon: FolderKanban, label: 'Plano de Contas' },
        { href: '/dashboard/financial-statements', icon: Receipt, label: 'Demonstrações' },
    ]
  },
  { href: '/dashboard/clients', icon: Contact, label: 'Clientes' },
  { href: '/dashboard/candidates', icon: Users, label: 'Banco de Talentos' },
  { href: '/dashboard/reports', icon: BarChart, label: 'Relatórios' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    accounting: pathname.startsWith('/dashboard/accounting') || pathname.startsWith('/dashboard/financial-statements'),
    epi: pathname.startsWith('/dashboard/epi'),
    purchasing: pathname.startsWith('/dashboard/purchasing'),
    services: pathname.startsWith('/dashboard/services'),
    supervision: pathname.startsWith('/dashboard/supervision'),
  });

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({...prev, [id]: !prev[id]}));
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 py-1">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              item.subItems ? (
                <Collapsible key={item.id} open={openMenus[item.id]} onOpenChange={() => toggleMenu(item.id)}>
                  <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                              className="w-full justify-between"
                              isActive={pathname.startsWith(`/dashboard/${item.id}`) || (item.id === 'accounting' && pathname.startsWith('/dashboard/financial-statements'))}
                              tooltip={item.label}
                              >
                              <div className='flex items-center gap-2'>
                                <item.icon />
                                <span>{item.label}</span>
                              </div>
                          </SidebarMenuButton>
                     </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                     <SidebarMenuSub>
                        {item.subItems.map(subItem => (
                          <SidebarMenuSubItem key={subItem.href}>
                              <Link href={subItem.href}>
                                  <SidebarMenuSubButton isActive={pathname === subItem.href}>
                                      <subItem.icon />
                                      <span>{subItem.label}</span>
                                  </SidebarMenuSubButton>
                              </Link>
                          </SidebarMenuSubItem>
                        ))}
                     </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.href}>
                   <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <Link href={item.href!}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://picsum.photos/seed/1/100/100" alt="Admin User" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Administrador</span>
                <span className="text-xs text-muted-foreground">admin@dskarga.com</span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
    </SidebarProvider>
  );
}
