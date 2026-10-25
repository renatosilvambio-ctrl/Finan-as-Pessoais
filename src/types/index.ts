export type CategoriaDespesaCartao = 
  | 'Alimentação'
  | 'Mercado'
  | 'Eletrônicos'
  | 'Vestuário'
  | 'Saúde'
  | 'Casa'
  | 'Transporte'
  | 'Lazer'
  | 'Educação'
  | 'Assinatura'
  | 'Outros';

export type CategoriaRecebimento = 
  | 'Salário'
  | 'Vale / Adiantamento'
  | 'Dívida de Terceiros'
  | 'Empréstimo'
  | 'Reembolso'
  | 'Venda'
  | 'Outros';

export type CategoriaContaPagar = 
  | 'Aluguel'
  | 'Condomínio'
  | 'Energia'
  | 'Água'
  | 'Internet'
  | 'Celular'
  | 'Seguro'
  | 'Financiamento'
  | 'Assinaturas'
  | 'Supermercado'
  | 'Saúde'
  | 'Dívidas'
  | 'Outros';

export type StatusRecebimento = 
  | 'a_receber'
  | 'recebido'
  | 'parcial'
  | 'atrasado'
  | 'cancelado';

export type StatusContaPagar = 
  | 'pendente'
  | 'pago'
  | 'parcial'
  | 'atrasado'
  | 'cancelado';

export interface Responsavel {
  id: string;
  nome: string;
  telefone?: string;
  observacoes?: string;
  ativo: boolean;
  is_owner?: boolean; // Indicar se é o dono da conta principal
  created_at: string;
}

export interface CartaoCredito {
  id: string;
  nome: string;
  apelido: string;
  dia_fechamento: number;
  dia_vencimento: number;
  limite?: number;
  cor?: string;
  ativo: boolean;
  created_at: string;
}

export interface DespesaCartao {
  id: string;
  cartao_id: string;
  responsavel_id: string;
  descricao: string;
  categoria: CategoriaDespesaCartao;
  valor_total: number;
  total_parcelas: number;
  data_compra: string; // YYYY-MM-DD
  primeiro_mes: string; // YYYY-MM
  observacoes?: string;
  created_at: string;
}

export interface ParcelaCartao {
  id: string;
  despesa_id: string;
  cartao_id: string;
  responsavel_id: string;
  numero_parcela: number;
  total_parcelas: number;
  mes_fatura: string; // YYYY-MM
  valor: number;
  paga: boolean;
  data_pagamento?: string;
  antecipada?: boolean;
  mes_original?: string;
  created_at: string;
}

export interface ContaReceber {
  id: string;
  descricao: string;
  pagador_nome: string;
  responsavel_id?: string;
  categoria: CategoriaRecebimento;
  valor: number;
  data_prevista: string; // YYYY-MM-DD
  mes_competencia: string; // YYYY-MM
  recorrencia: 'nenhuma' | 'mensal_fixo' | 'quinto_dia_util';
  dia_fixo?: number;
  divida_id?: string; // Se faz parte de uma dívida parcelada
  total_parcelas?: number;
  numero_parcela?: number;
  status: StatusRecebimento;
  valor_recebido: number;
  data_recebimento?: string;
  observacoes?: string;
  created_at: string;
}

export interface ContaPagar {
  id: string;
  descricao: string;
  categoria: CategoriaContaPagar;
  valor: number;
  data_vencimento: string; // YYYY-MM-DD
  mes_competencia: string; // YYYY-MM
  recorrencia: 'nenhuma' | 'mensal';
  total_parcelas?: number;
  numero_parcela?: number;
  status: StatusContaPagar;
  valor_pago: number;
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
}

export interface PagamentoFaturaResponsavel {
  id: string;
  cartao_id: string;
  responsavel_id: string;
  mes_fatura: string; // YYYY-MM
  valor_devido: number;
  valor_pago: number;
  pago_totalmente: boolean;
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
}

export interface ResumoMes {
  mes: string; // YYYY-MM
  total_fatura_cartao: number;
  total_minha_parte_cartao: number;
  total_terceiros_cartao: number;
  total_terceiros_pago: number;
  total_terceiros_pendente: number;
  total_a_receber: number;
  total_recebido: number;
  total_receber_pendente: number;
  total_contas_pagar: number;
  total_contas_pagas: number;
  total_contas_pendentes: number;
  total_contas_atrasadas: number;
  saldo_previsto: number;
  saldo_realizado: number;
}

export type TabNavegacao = 'inicio' | 'cartao' | 'receber' | 'contas' | 'mais';
export type SubTabMais = 'previsao' | 'relatorios' | 'responsaveis' | 'cartoes' | 'configuracoes';
