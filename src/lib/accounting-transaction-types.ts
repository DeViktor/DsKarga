// Transaction type identification based on PGC account codes
export type TransactionType = 
  | 'deposito_bancario'
  | 'levantamento_bancario'
  | 'venda_mercadorias'
  | 'venda_servicos'
  | 'compra_mercadorias'
  | 'compra_servicos'
  | 'pagamento_fornecedor'
  | 'recebimento_cliente'
  | 'pagamento_salarios'
  | 'pagamento_impostos'
  | 'entrada_capital'
  | 'saida_capital'
  | 'juros_recebidos'
  | 'juros_pagos'
  | 'despesa_administrativa'
  | 'despesa_comercial'
  | 'despesa_financeira'
  | 'outro';

export interface TransactionTypeInfo {
  type: TransactionType;
  description: string;
  icon: string;
  color: string;
}

export function identifyTransactionType(lines: Array<{accountId: string; accountName: string; debit: number; credit: number}>): TransactionTypeInfo {
  if (!lines || lines.length === 0) {
    return {
      type: 'outro',
      description: 'Sem linhas',
      icon: '❓',
      color: 'text-gray-500'
    };
  }

  const accounts = lines.map(line => ({
    code: line.accountId.split('.')[0], // Get main account code (e.g., '41' from '41.1')
    fullCode: line.accountId,
    name: line.accountName.toLowerCase(),
    debit: line.debit,
    credit: line.credit
  }));

  const hasDebit = (code: string) => accounts.some(acc => acc.code === code && acc.debit > 0);
  const hasCredit = (code: string) => accounts.some(acc => acc.code === code && acc.credit > 0);
  const getDebitAmount = (code: string) => accounts.filter(acc => acc.code === code).reduce((sum, acc) => sum + acc.debit, 0);
  const getCreditAmount = (code: string) => accounts.filter(acc => acc.code === code).reduce((sum, acc) => sum + acc.credit, 0);

  // Bank transactions (accounts 41.x and 43.x)
  if (hasDebit('41') || hasDebit('43')) {
    if (hasCredit('31') || hasCredit('311')) {
      return {
        type: 'recebimento_cliente',
        description: 'Recebimento de Cliente',
        icon: '💰',
        color: 'text-green-600'
      };
    }
    if (hasCredit('71') || hasCredit('72')) {
      return {
        type: 'venda_servicos',
        description: 'Venda de Serviços',
        icon: '📊',
        color: 'text-blue-600'
      };
    }
    if (hasCredit('79')) {
      return {
        type: 'juros_recebidos',
        description: 'Juros Recebidos',
        icon: '📈',
        color: 'text-green-600'
      };
    }
    return {
      type: 'deposito_bancario',
      description: 'Depósito Bancário',
      icon: '🏦',
      color: 'text-blue-600'
    };
  }

  if (hasCredit('41') || hasCredit('43')) {
    if (hasDebit('32') || hasDebit('321')) {
      return {
        type: 'pagamento_fornecedor',
        description: 'Pagamento a Fornecedor',
        icon: '💳',
        color: 'text-red-600'
      };
    }
    if (hasDebit('63') || hasDebit('631') || hasDebit('635')) {
      return {
        type: 'pagamento_salarios',
        description: 'Pagamento de Salários',
        icon: '👷',
        color: 'text-purple-600'
      };
    }
    if (hasDebit('34') || hasDebit('343') || hasDebit('344')) {
      return {
        type: 'pagamento_impostos',
        description: 'Pagamento de Impostos',
        icon: '📋',
        color: 'text-orange-600'
      };
    }
    if (hasDebit('69')) {
      return {
        type: 'juros_pagos',
        description: 'Juros Pagos',
        icon: '📉',
        color: 'text-red-600'
      };
    }
    return {
      type: 'levantamento_bancario',
      description: 'Levantamento Bancário',
      icon: '🏧',
      color: 'text-red-600'
    };
  }

  // Sales transactions
  if (hasCredit('71')) {
    if (hasDebit('31') || hasDebit('311')) {
      return {
        type: 'venda_mercadorias',
        description: 'Venda de Mercadorias',
        icon: '🛒',
        color: 'text-green-600'
      };
    }
    return {
      type: 'venda_mercadorias',
      description: 'Venda de Mercadorias',
      icon: '🛍️',
      color: 'text-green-600'
    };
  }

  if (hasCredit('72')) {
    return {
      type: 'venda_servicos',
      description: 'Prestação de Serviços',
      icon: '🔧',
      color: 'text-blue-600'
    };
  }

  // Purchase transactions
  if (hasDebit('61') || hasDebit('62')) {
    return {
      type: 'compra_mercadorias',
      description: 'Compra de Mercadorias/Serviços',
      icon: '📦',
      color: 'text-orange-600'
    };
  }

  // Personnel costs
  if (hasDebit('63') || hasDebit('631') || hasDebit('635')) {
    return {
      type: 'pagamento_salarios',
      description: 'Custos com Pessoal',
      icon: '💼',
      color: 'text-purple-600'
    };
  }

  // Capital transactions
  if (hasCredit('51')) {
    return {
      type: 'entrada_capital',
      description: 'Entrada de Capital',
      icon: '💎',
      color: 'text-green-600'
    };
  }

  if (hasDebit('58') || hasDebit('88')) {
    return {
      type: 'saida_capital',
      description: 'Saída de Capital/Resultados',
      icon: '📊',
      color: 'text-blue-600'
    };
  }

  // Financial expenses/income
  if (hasDebit('69')) {
    return {
      type: 'despesa_financeira',
      description: 'Despesa Financeira',
      icon: '📉',
      color: 'text-red-600'
    };
  }

  if (hasCredit('79')) {
    return {
      type: 'despesa_administrativa',
      description: 'Proveito Financeiro',
      icon: '📈',
      color: 'text-green-600'
    };
  }

  // Administrative expenses
  if (hasDebit('62')) {
    return {
      type: 'despesa_administrativa',
      description: 'Despesa Administrativa',
      icon: '🏢',
      color: 'text-gray-600'
    };
  }

  return {
    type: 'outro',
    description: 'Outro Lançamento',
    icon: '📄',
    color: 'text-gray-500'
  };
}

export function getTransactionTypeDescription(type: TransactionType): string {
  const descriptions: Record<TransactionType, string> = {
    'deposito_bancario': 'Depósito Bancário',
    'levantamento_bancario': 'Levantamento Bancário',
    'venda_mercadorias': 'Venda de Mercadorias',
    'venda_servicos': 'Prestação de Serviços',
    'compra_mercadorias': 'Compra de Mercadorias',
    'compra_servicos': 'Compra de Serviços',
    'pagamento_fornecedor': 'Pagamento a Fornecedor',
    'recebimento_cliente': 'Recebimento de Cliente',
    'pagamento_salarios': 'Pagamento de Salários',
    'pagamento_impostos': 'Pagamento de Impostos',
    'entrada_capital': 'Entrada de Capital',
    'saida_capital': 'Saída de Capital',
    'juros_recebidos': 'Juros Recebidos',
    'juros_pagos': 'Juros Pagos',
    'despesa_administrativa': 'Despesa Administrativa',
    'despesa_comercial': 'Despesa Comercial',
    'despesa_financeira': 'Despesa Financeira',
    'outro': 'Outro Lançamento'
  };
  return descriptions[type] || 'Lançamento Contabilístico';
}