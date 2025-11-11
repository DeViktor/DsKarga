
export interface PGCAccount {
    id: string;
    code: string;
    name: string;
    class: string;
    isCustom?: boolean;
}

export const pgcAccounts: PGCAccount[] = [
    { id: 'pgc-11', code: '11', name: 'Imobilizações Corpóreas', class: 'Contas de Balanço - Activo', isCustom: false },
    { id: 'pgc-113', code: '11.3', name: 'Equipamento Básico', class: 'Contas de Balanço - Activo', isCustom: false },
    { id: 'pgc-12', code: '12', name: 'Imobilizações Incorpóreas', class: 'Contas de Balanço - Activo', isCustom: false },
    { id: 'pgc-21', code: '21', name: 'Compras', class: 'Contas de Resultados - Custos', isCustom: false },
    { id: 'pgc-211', code: '21.1', name: 'Mercadorias', class: 'Contas de Resultados - Custos', isCustom: false },
    { id: 'pgc-26', code: '26', name: 'Matérias Subsidiárias, Consumíveis', class: 'Contas de Balanço - Activo', isCustom: false },
    { id: 'pgc-31', code: '31', name: 'Clientes', class: 'Contas de Balanço - Activo', isCustom: false },
    { id: 'pgc-311', code: '31.1', name: 'Clientes c/c', class: 'Contas de Balanço - Activo', isCustom: false },
    { id: 'pgc-32', code: '32', name: 'Fornecedores', class: 'Contas de Balanço - Passivo', isCustom: false },
    { id: 'pgc-321', code: '32.1', name: 'Fornecedores c/c', class: 'Contas de Balanço - Passivo', isCustom: false },
    { id: 'pgc-34', code: '34', name: 'Estado', class: 'Contas de Balanço - Passivo', isCustom: false },
    { id: 'pgc-343', code: '34.3', name: 'Imposto sobre o Rendimento do Trabalho', class: 'Contas de Balanço - Passivo', isCustom: false },
    { id: 'pgc-344', code: '34.4', name: 'Imposto de Consumo', class: 'Contas de Balanço - Passivo', isCustom: false },
    { id: 'pgc-41', code: '41', name: 'Depósitos à Ordem', class: 'Contas de Balanço - Activo', isCustom: false },
    { id: 'pgc-43', code: '43', name: 'Caixa', class: 'Contas de Balanço - Activo', isCustom: false },
    { id: 'pgc-51', code: '51', name: 'Capital', class: 'Contas de Balanço - Capital Próprio', isCustom: false },
    { id: 'pgc-58', code: '58', name: 'Resultados Transitados', class: 'Contas de Balanço - Capital Próprio', isCustom: false },
    { id: 'pgc-61', code: '61', name: 'Custo das Mercadorias Vendidas e Matérias Consumidas', class: 'Contas de Resultados - Custos', isCustom: false },
    { id: 'pgc-62', code: '62', name: 'Fornecimentos e Serviços Externos', class: 'Contas de Resultados - Custos', isCustom: false },
    { id: 'pgc-63', code: '63', name: 'Custos com o Pessoal', class: 'Contas de Resultados - Custos', isCustom: false },
    { id: 'pgc-631', code: '63.1', name: 'Remunerações', class: 'Contas de Resultados - Custos', isCustom: false },
    { id: 'pgc-635', code: '63.5', name: 'Encargos sobre Remunerações', class: 'Contas de Resultados - Custos', isCustom: false },
    { id: 'pgc-69', code: '69', name: 'Custos e Perdas Financeiros', class: 'Contas de Resultados - Custos', isCustom: false },
    { id: 'pgc-71', code: '71', name: 'Vendas', class: 'Contas de Resultados - Proveitos', isCustom: false },
    { id: 'pgc-72', code: '72', name: 'Prestações de Serviços', class: 'Contas de Resultados - Proveitos', isCustom: false },
    { id: 'pgc-79', code: '79', name: 'Proveitos e Ganhos Financeiros', class: 'Contas de Resultados - Proveitos', isCustom: false },
    { id: 'pgc-81', code: '81', name: 'Resultados Operacionais', class: 'Contas de Resultados - Resultados', isCustom: false },
    { id: 'pgc-88', code: '88', name: 'Resultado Líquido do Exercício', class: 'Contas de Resultados - Resultados', isCustom: false },
];
