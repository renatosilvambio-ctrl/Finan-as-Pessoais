import {
  Responsavel,
  CartaoCredito,
  DespesaCartao,
  ParcelaCartao,
  ContaReceber,
  ContaPagar,
  PagamentoFaturaResponsavel,
} from '../types';
import { splitInstallments } from '../utils/currency';
import { addMonths, getQuintoDiaUtil } from '../utils/dateUtils';

const STORAGE_KEY = 'meu_controle_financeiro_data_v1';

export interface StorageData {
  responsaveis: Responsavel[];
  cartoes: CartaoCredito[];
  despesas: DespesaCartao[];
  parcelas: ParcelaCartao[];
  contasReceber: ContaReceber[];
  contasPagar: ContaPagar[];
  pagamentosFatura: PagamentoFaturaResponsavel[];
  configuracoes: {
    chavePix: string;
    temaEscuro: boolean;
    donoNome: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  };
}

export function generateInitialSeedData(): StorageData {
  const currentMonth = '2026-11';

  // 1. Responsáveis
  const responsaveis: Responsavel[] = [
    {
      id: 'resp-renato',
      nome: 'Renato (Eu)',
      telefone: '11999998888',
      observacoes: 'Titular da conta e dos cartões',
      ativo: true,
      is_owner: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'resp-ricardo',
      nome: 'Ricardo',
      telefone: '11988887777',
      observacoes: 'Irmão - utiliza o cartão Ultravioleta',
      ativo: true,
      is_owner: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'resp-mae',
      nome: 'Mãe',
      telefone: '11977776666',
      observacoes: 'Despesas de saúde e farmácia',
      ativo: true,
      is_owner: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'resp-outros',
      nome: 'Outros',
      observacoes: 'Amigos ou despesas avulsas',
      ativo: true,
      is_owner: false,
      created_at: new Date().toISOString(),
    },
  ];

  // 2. Cartões de Crédito
  const cartoes: CartaoCredito[] = [
    {
      id: 'card-nubank',
      nome: 'Nubank Ultravioleta',
      apelido: 'Roxinho Principal',
      dia_fechamento: 24,
      dia_vencimento: 5,
      limite: 15000,
      cor: '#820AD9',
      ativo: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'card-itau',
      nome: 'Itaú Click Visa',
      apelido: 'Itaú Reserva',
      dia_fechamento: 15,
      dia_vencimento: 22,
      limite: 8000,
      cor: '#EC7000',
      ativo: true,
      created_at: new Date().toISOString(),
    },
  ];

  // 3. Despesas do Cartão
  const despesas: DespesaCartao[] = [
    {
      id: 'desp-tv-ricardo',
      cartao_id: 'card-nubank',
      responsavel_id: 'resp-ricardo',
      descricao: 'TV Sala 4K',
      categoria: 'Eletrônicos',
      valor_total: 4996.56,
      total_parcelas: 24,
      data_compra: '2026-10-20',
      primeiro_mes: '2026-11',
      observacoes: 'Compra parcelada pelo Ricardo (R$ 208,19/mês)',
      created_at: new Date().toISOString(),
    },
    {
      id: 'desp-pizzaria-ricardo',
      cartao_id: 'card-nubank',
      responsavel_id: 'resp-ricardo',
      descricao: 'Pizzaria Comemoração',
      categoria: 'Alimentação',
      valor_total: 184.50,
      total_parcelas: 1,
      data_compra: '2026-11-02',
      primeiro_mes: '2026-11',
      observacoes: 'Jantar compartilhado',
      created_at: new Date().toISOString(),
    },
    {
      id: 'desp-notebook-renato',
      cartao_id: 'card-nubank',
      responsavel_id: 'resp-renato',
      descricao: 'Monitor UltraWide',
      categoria: 'Eletrônicos',
      valor_total: 1650.00,
      total_parcelas: 6,
      data_compra: '2026-09-15',
      primeiro_mes: '2026-10',
      observacoes: 'Trabalho / Home Office',
      created_at: new Date().toISOString(),
    },
    {
      id: 'desp-farmacia-mae',
      cartao_id: 'card-nubank',
      responsavel_id: 'resp-mae',
      descricao: 'Medicamentos Droga Raia',
      categoria: 'Saúde',
      valor_total: 240.00,
      total_parcelas: 3,
      data_compra: '2026-11-04',
      primeiro_mes: '2026-11',
      created_at: new Date().toISOString(),
    },
    {
      id: 'desp-combustivel-renato',
      cartao_id: 'card-itau',
      responsavel_id: 'resp-renato',
      descricao: 'Posto Shell Combustível',
      categoria: 'Transporte',
      valor_total: 210.00,
      total_parcelas: 1,
      data_compra: '2026-11-08',
      primeiro_mes: '2026-11',
      created_at: new Date().toISOString(),
    },
  ];

  // 4. Gerar Parcelas do Cartão
  const parcelas: ParcelaCartao[] = [];
  despesas.forEach((desp) => {
    const valoresParcelas = splitInstallments(desp.valor_total, desp.total_parcelas);
    valoresParcelas.forEach((valor, index) => {
      const numeroParcela = index + 1;
      const mesFatura = addMonths(desp.primeiro_mes, index);
      // Se já passou de outubro, marcar parcelas passadas como pagas
      const isPast = mesFatura < currentMonth;
      parcelas.push({
        id: `parc-${desp.id}-${numeroParcela}`,
        despesa_id: desp.id,
        cartao_id: desp.cartao_id,
        responsavel_id: desp.responsavel_id,
        numero_parcela: numeroParcela,
        total_parcelas: desp.total_parcelas,
        mes_fatura: mesFatura,
        valor: valor,
        paga: isPast,
        data_pagamento: isPast ? `${mesFatura}-05` : undefined,
        created_at: new Date().toISOString(),
      });
    });
  });

  // 5. Contas a Receber (Salário, 5º dia útil, dívidas de terceiros parceladas)
  const contasReceber: ContaReceber[] = [
    {
      id: 'rec-salario-nov',
      descricao: 'Salário Mensal',
      pagador_nome: 'Empresa Tecnologia Ltda',
      categoria: 'Salário',
      valor: 4850.00,
      data_prevista: getQuintoDiaUtil('2026-11'),
      mes_competencia: '2026-11',
      recorrencia: 'quinto_dia_util',
      status: 'recebido',
      valor_recebido: 4850.00,
      data_recebimento: '2026-11-09',
      observacoes: 'Recebido pontualmente no 5º dia útil',
      created_at: new Date().toISOString(),
    },
    {
      id: 'rec-vale-nov',
      descricao: 'Adiantamento Quinzenal (Vale)',
      pagador_nome: 'Empresa Tecnologia Ltda',
      categoria: 'Vale / Adiantamento',
      valor: 1600.00,
      data_prevista: '2026-11-20',
      mes_competencia: '2026-11',
      recorrencia: 'mensal_fixo',
      dia_fixo: 20,
      status: 'a_receber',
      valor_recebido: 0,
      created_at: new Date().toISOString(),
    },
    // Dívida de terceiro parcelada em 10x de R$ 500
    ...Array.from({ length: 10 }, (_, i) => {
      const mes = addMonths('2026-08', i);
      const isPast = mes < currentMonth;
      return {
        id: `rec-divida-carlos-${i + 1}`,
        descricao: 'Empréstimo Amigo Carlos',
        pagador_nome: 'Carlos Eduardo',
        categoria: 'Dívida de Terceiros' as const,
        valor: 500.00,
        data_prevista: `${mes}-10`,
        mes_competencia: mes,
        recorrencia: 'nenhuma' as const,
        divida_id: 'divida-carlos-5k',
        total_parcelas: 10,
        numero_parcela: i + 1,
        status: (isPast ? 'recebido' : 'a_receber') as any,
        valor_recebido: isPast ? 500.00 : 0,
        data_recebimento: isPast ? `${mes}-10` : undefined,
        observacoes: `Parcela ${i + 1}/10 do acordo total de R$ 5.000,00`,
        created_at: new Date().toISOString(),
      };
    }),
  ];

  // 6. Contas a Pagar (Contas fixas e recorrentes pessoais)
  const contasPagar: ContaPagar[] = [
    {
      id: 'pag-aluguel-nov',
      descricao: 'Aluguel do Apartamento',
      categoria: 'Aluguel',
      valor: 1750.00,
      data_vencimento: '2026-11-10',
      mes_competencia: '2026-11',
      recorrencia: 'mensal',
      status: 'pago',
      valor_pago: 1750.00,
      data_pagamento: '2026-11-09',
      observacoes: 'Transferência bancária para imobiliária',
      created_at: new Date().toISOString(),
    },
    {
      id: 'pag-condominio-nov',
      descricao: 'Condomínio Residencial',
      categoria: 'Condomínio',
      valor: 420.00,
      data_vencimento: '2026-11-15',
      mes_competencia: '2026-11',
      recorrencia: 'mensal',
      status: 'pendente',
      valor_pago: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'pag-energia-nov',
      descricao: 'Conta de Energia Elétrica',
      categoria: 'Energia',
      valor: 154.30,
      data_vencimento: '2026-11-18',
      mes_competencia: '2026-11',
      recorrencia: 'mensal',
      status: 'pendente',
      valor_pago: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'pag-internet-nov',
      descricao: 'Internet Fibra Óptica 600MB',
      categoria: 'Internet',
      valor: 119.90,
      data_vencimento: '2026-11-25',
      mes_competencia: '2026-11',
      recorrencia: 'mensal',
      status: 'pendente',
      valor_pago: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'pag-academia-nov',
      descricao: 'Assinatura Academia SmartFit',
      categoria: 'Assinaturas',
      valor: 129.90,
      data_vencimento: '2026-11-12',
      mes_competencia: '2026-11',
      recorrencia: 'mensal',
      status: 'pago',
      valor_pago: 129.90,
      data_pagamento: '2026-11-12',
      created_at: new Date().toISOString(),
    },
  ];

  // 7. Pagamentos de Fatura por Responsável
  const pagamentosFatura: PagamentoFaturaResponsavel[] = [
    {
      id: 'pagfat-ricardo-nov',
      cartao_id: 'card-nubank',
      responsavel_id: 'resp-ricardo',
      mes_fatura: '2026-11',
      valor_devido: 392.69,
      valor_pago: 0,
      pago_totalmente: false,
      observacoes: 'Aguardando transferência via PIX',
      created_at: new Date().toISOString(),
    },
  ];

  return {
    responsaveis,
    cartoes,
    despesas,
    parcelas,
    contasReceber,
    contasPagar,
    pagamentosFatura,
    configuracoes: {
      chavePix: 'renatosilvambio@gmail.com',
      temaEscuro: false,
      donoNome: 'Renato',
    },
  };
}

export function loadStoredData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialSeedData();
      saveStoredData(initial);
      return initial;
    }
    const data = JSON.parse(raw) as StorageData;
    // Basic validation
    if (!data.responsaveis || !data.cartoes || !data.despesas) {
      const initial = generateInitialSeedData();
      saveStoredData(initial);
      return initial;
    }
    return data;
  } catch (err) {
    console.error('Error loading stored finance data, resetting to seed:', err);
    const initial = generateInitialSeedData();
    saveStoredData(initial);
    return initial;
  }
}

export function saveStoredData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving finance data to localStorage:', err);
  }
}

export function exportBackupJSON(): string {
  const data = loadStoredData();
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString) as StorageData;
    if (parsed.responsaveis && parsed.cartoes && parsed.despesas) {
      saveStoredData(parsed);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
