# Sistema de Atividades em Tempo Real

## Visão Geral

O sistema de atividades em tempo real foi implementado para substituir os dados mockados na seção "Atividades Recentes" do dashboard por dados reais que são atualizados conforme os usuários interagem com o sistema.

## Componentes Implementados

### 1. Hook de Atividades (`src/hooks/use-activities.ts`)
- Gerencia a conexão com o Firebase Firestore para atividades
- Fornece dados em tempo real usando `onSnapshot`
- Função `logActivity` para registrar novas atividades

### 2. Componente de Atividades Recentes (`src/components/dashboard/recent-activities-real.tsx`)
- Substitui o componente mockado por versão com dados reais
- Formata timestamps usando `date-fns`
- Exibe ícones baseados no tipo de atividade

### 3. Sistema de Log de Atividades (`src/hooks/use-activity-logger.ts`)
- Hook `useActivityLogger` para facilitar o registro de atividades
- Constantes pré-definidas para ações e alvos
- Integração com perfil do usuário

### 4. Contexto de Usuário (`src/contexts/user-context.tsx`)
- Gerencia informações do perfil do usuário atual
- Fornece dados necessários para o log de atividades

## Tipos de Atividades Suportadas

- **Trabalhadores**: criação, atualização, exclusão
- **Serviços**: criação, atualização, atribuição
- **Clientes**: criação, atualização
- **Assiduidade**: registro diário
- **EPI**: entregas, devoluções
- **Compras**: solicitações, aprovações
- **Contabilidade**: lançamentos, atualizações
- **Supervisão**: relatórios, inspeções
- **Acidentes**: registros, atualizações
- **Candidatos**: adições, atualizações

## Como Usar

### Para Registrar uma Atividade

```typescript
import { useActivityLogger, ActivityActions, ActivityTargets } from '@/hooks/use-activity-logger';

function MeuComponente() {
  const { logActivity } = useActivityLogger();

  const handleCreateWorker = async (workerData) => {
    // ... código para criar trabalhador ...
    
    await logActivity(
      ActivityActions.CREATE,           // Ação realizada
      workerData.name,                  // Nome do alvo
      'worker',                         // Tipo do alvo
      { department: workerData.department } // Metadados opcionais
    );
  };
}
```

### Ações Disponíveis
- `CREATE` - criou
- `UPDATE` - atualizou
- `DELETE` - excluiu
- `APPROVE` - aprovou
- `REJECT` - rejeitou
- `GENERATE` - gerou
- `ASSIGN` - atribuiu
- `REGISTER` - registrou
- `COMPLETE` - completou
- `SUSPEND` - suspendeu
- `ACTIVATE` - ativou

### Tipos de Alvo
- `worker` - trabalhador
- `service` - serviço
- `client` - cliente
- `invoice` - fatura
- `payment` - pagamento
- `attendance` - assiduidade
- `accident` - acidente
- `epi` - EPI
- `purchasing` - compra
- `accounting` - lançamento
- `supervision` - supervisão
- `candidate` - candidato

## Integrações Realizadas

### 1. Gestão de Trabalhadores
- `src/components/dashboard/worker-dialog.tsx` - Log ao criar/atualizar trabalhadores

### 2. Gestão de Serviços
- `src/app/dashboard/services/new/page.tsx` - Log ao criar novos serviços

### 3. Assiduidade
- `src/app/dashboard/attendance/page.tsx` - Log ao registrar folhas de assiduidade

## Estrutura dos Dados

Cada atividade no Firebase contém:
```typescript
{
  user: string,          // Nome do usuário
  userId: string,        // ID do usuário
  userAvatar: string,    // Avatar ou inicial do usuário
  action: string,        // Ação realizada
  target: string,        // Nome/nome do alvo
  targetType: string,    // Tipo do alvo
  timestamp: Timestamp,  // Timestamp do Firebase
  metadata: object       // Dados adicionais opcionais
}
```

## Próximos Passos

Para completar a implementação, você pode:

1. **Adicionar mais integrações**: Implementar log de atividades em outros módulos
2. **Filtros e pesquisa**: Adicionar filtros por tipo de atividade, data, usuário
3. **Notificações em tempo real**: Implementar notificações para atividades importantes
4. **Dashboard de estatísticas**: Criar visualizações de dados de atividades
5. **Exportação**: Adicionar funcionalidade de exportação de logs

## Notas Importantes

- O sistema requer que o usuário esteja autenticado para registrar atividades
- As atividades são armazenadas no Firebase Firestore
- O tempo de retenção dos dados pode ser configurado nas regras do Firebase
- O sistema é escalável e suporta múltiplos usuários simultâneos