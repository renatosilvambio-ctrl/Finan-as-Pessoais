import { getSupabaseClient } from './supabase';
import {
  Responsavel,
  CartaoCredito,
  DespesaCartao,
  ParcelaCartao,
  ContaReceber,
  ContaPagar,
  PagamentoFaturaResponsavel,
} from '../types';
import { StorageData } from './storage';

export interface CloudFetchResult {
  hasData: boolean;
  data: StorageData | null;
}

/**
 * Carrega todos os registros do banco Supabase para o uso exclusivo do titular
 */
export async function fetchUserCloudData(): Promise<CloudFetchResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { hasData: false, data: null };
  }

  try {
    const [
      respRes,
      cardsRes,
      despRes,
      parcRes,
      recRes,
      pagRes,
      pagFatRes,
      confRes,
    ] = await Promise.all([
      client.from('responsaveis').select('*'),
      client.from('cartoes').select('*'),
      client.from('despesas_cartao').select('*'),
      client.from('parcelas_cartao').select('*'),
      client.from('contas_receber').select('*'),
      client.from('contas_pagar').select('*'),
      client.from('pagamentos_fatura_responsavel').select('*'),
      client.from('configuracoes_usuario').select('*').limit(1).maybeSingle(),
    ]);

    const responsaveis: Responsavel[] = (respRes.data || []).map((r) => ({
      id: r.id,
      nome: r.nome,
      telefone: r.telefone,
      observacoes: r.observacoes,
      ativo: r.ativo,
      is_owner: r.is_owner,
      created_at: r.created_at,
    }));

    const cartoes: CartaoCredito[] = (cardsRes.data || []).map((c) => ({
      id: c.id,
      nome: c.nome,
      apelido: c.apelido,
      dia_fechamento: c.dia_fechamento,
      dia_vencimento: c.dia_vencimento,
      limite: c.limite ? Number(c.limite) : undefined,
      cor: c.cor,
      ativo: c.ativo,
      created_at: c.created_at,
    }));

    const despesas: DespesaCartao[] = (despRes.data || []).map((d) => ({
      id: d.id,
      cartao_id: d.cartao_id,
      responsavel_id: d.responsavel_id,
      descricao: d.descricao,
      categoria: d.categoria,
      valor_total: Number(d.valor_total),
      total_parcelas: d.total_parcelas,
      data_compra: d.data_compra,
      primeiro_mes: d.primeiro_mes,
      observacoes: d.observacoes,
      created_at: d.created_at,
    }));

    const parcelas: ParcelaCartao[] = (parcRes.data || []).map((p) => ({
      id: p.id,
      despesa_id: p.despesa_id,
      cartao_id: p.cartao_id,
      responsavel_id: p.responsavel_id,
      numero_parcela: p.numero_parcela,
      total_parcelas: p.total_parcelas,
      mes_fatura: p.mes_fatura,
      mes_original: p.mes_original,
      valor: Number(p.valor),
      paga: p.paga,
      data_pagamento: p.data_pagamento,
      antecipada: p.antecipada,
      created_at: p.created_at,
    }));

    const contasReceber: ContaReceber[] = (recRes.data || []).map((c) => ({
      id: c.id,
      descricao: c.descricao,
      pagador_nome: c.pagador_nome,
      responsavel_id: c.responsavel_id,
      categoria: c.categoria,
      valor: Number(c.valor),
      data_prevista: c.data_prevista,
      mes_competencia: c.mes_competencia,
      recorrencia: c.recorrencia,
      dia_fixo: c.dia_fixo,
      divida_id: c.divida_id,
      total_parcelas: c.total_parcelas,
      numero_parcela: c.numero_parcela,
      status: c.status,
      valor_recebido: Number(c.valor_recebido || 0),
      data_recebimento: c.data_recebimento,
      observacoes: c.observacoes,
      created_at: c.created_at,
    }));

    const contasPagar: ContaPagar[] = (pagRes.data || []).map((p) => ({
      id: p.id,
      descricao: p.descricao,
      categoria: p.categoria,
      valor: Number(p.valor),
      data_vencimento: p.data_vencimento,
      mes_competencia: p.mes_competencia,
      recorrencia: p.recorrencia,
      total_parcelas: p.total_parcelas,
      numero_parcela: p.numero_parcela,
      status: p.status,
      valor_pago: Number(p.valor_pago || 0),
      data_pagamento: p.data_pagamento,
      observacoes: p.observacoes,
      created_at: p.created_at,
    }));

    const pagamentosFatura: PagamentoFaturaResponsavel[] = (pagFatRes.data || []).map((pf) => ({
      id: pf.id,
      cartao_id: pf.cartao_id,
      responsavel_id: pf.responsavel_id,
      mes_fatura: pf.mes_fatura,
      valor_devido: Number(pf.valor_devido),
      valor_pago: Number(pf.valor_pago),
      pago_totalmente: pf.pago_totalmente,
      data_pagamento: pf.data_pagamento,
      observacoes: pf.observacoes,
      created_at: pf.created_at,
    }));

    const hasData =
      responsaveis.length > 0 ||
      cartoes.length > 0 ||
      despesas.length > 0 ||
      contasReceber.length > 0 ||
      contasPagar.length > 0;

    const configuracoes = {
      chavePix: confRes.data?.chave_pix || 'renatosilvambio@gmail.com',
      donoNome: confRes.data?.dono_nome || 'Renato',
      temaEscuro: confRes.data?.tema_escuro || false,
    };

    return {
      hasData,
      data: {
        responsaveis,
        cartoes,
        despesas,
        parcelas,
        contasReceber,
        contasPagar,
        pagamentosFatura,
        configuracoes,
      },
    };
  } catch (err) {
    console.error('Erro ao buscar dados do Supabase:', err);
    return { hasData: false, data: null };
  }
}

/**
 * Salva todos os dados locais para a nuvem Supabase
 */
export async function syncAllDataToCloud(data: StorageData): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Responsaveis
    if (data.responsaveis.length > 0) {
      const rows = data.responsaveis.map((r) => ({
        id: r.id,
        nome: r.nome,
        telefone: r.telefone,
        observacoes: r.observacoes,
        ativo: r.ativo,
        is_owner: r.is_owner,
      }));
      await client.from('responsaveis').upsert(rows);
    }

    // 2. Cartões
    if (data.cartoes.length > 0) {
      const rows = data.cartoes.map((c) => ({
        id: c.id,
        nome: c.nome,
        apelido: c.apelido,
        dia_fechamento: c.dia_fechamento,
        dia_vencimento: c.dia_vencimento,
        limite: c.limite,
        cor: c.cor,
        ativo: c.ativo,
      }));
      await client.from('cartoes').upsert(rows);
    }

    // 3. Despesas do Cartão
    if (data.despesas.length > 0) {
      const rows = data.despesas.map((d) => ({
        id: d.id,
        cartao_id: d.cartao_id,
        responsavel_id: d.responsavel_id,
        descricao: d.descricao,
        categoria: d.categoria,
        valor_total: d.valor_total,
        total_parcelas: d.total_parcelas,
        data_compra: d.data_compra,
        primeiro_mes: d.primeiro_mes,
        observacoes: d.observacoes,
      }));
      await client.from('despesas_cartao').upsert(rows);
    }

    // 4. Parcelas do Cartão
    if (data.parcelas.length > 0) {
      const rows = data.parcelas.map((p) => ({
        id: p.id,
        despesa_id: p.despesa_id,
        cartao_id: p.cartao_id,
        responsavel_id: p.responsavel_id,
        numero_parcela: p.numero_parcela,
        total_parcelas: p.total_parcelas,
        mes_fatura: p.mes_fatura,
        mes_original: p.mes_original,
        valor: p.valor,
        paga: p.paga,
        data_pagamento: p.data_pagamento,
        antecipada: p.antecipada,
      }));
      await client.from('parcelas_cartao').upsert(rows);
    }

    // 5. Contas a Receber
    if (data.contasReceber.length > 0) {
      const rows = data.contasReceber.map((c) => ({
        id: c.id,
        descricao: c.descricao,
        pagador_nome: c.pagador_nome,
        responsavel_id: c.responsavel_id,
        categoria: c.categoria,
        valor: c.valor,
        data_prevista: c.data_prevista,
        mes_competencia: c.mes_competencia,
        recorrencia: c.recorrencia,
        dia_fixo: c.dia_fixo,
        divida_id: c.divida_id,
        total_parcelas: c.total_parcelas,
        numero_parcela: c.numero_parcela,
        status: c.status,
        valor_recebido: c.valor_recebido,
        data_recebimento: c.data_recebimento,
        observacoes: c.observacoes,
      }));
      await client.from('contas_receber').upsert(rows);
    }

    // 6. Contas a Pagar
    if (data.contasPagar.length > 0) {
      const rows = data.contasPagar.map((p) => ({
        id: p.id,
        descricao: p.descricao,
        categoria: p.categoria,
        valor: p.valor,
        data_vencimento: p.data_vencimento,
        mes_competencia: p.mes_competencia,
        recorrencia: p.recorrencia,
        total_parcelas: p.total_parcelas,
        numero_parcela: p.numero_parcela,
        status: p.status,
        valor_pago: p.valor_pago,
        data_pagamento: p.data_pagamento,
        observacoes: p.observacoes,
      }));
      await client.from('contas_pagar').upsert(rows);
    }

    // 7. Pagamentos de Fatura
    if (data.pagamentosFatura && data.pagamentosFatura.length > 0) {
      const rows = data.pagamentosFatura.map((pf) => ({
        id: pf.id,
        cartao_id: pf.cartao_id,
        responsavel_id: pf.responsavel_id,
        mes_fatura: pf.mes_fatura,
        valor_devido: pf.valor_devido,
        valor_pago: pf.valor_pago,
        pago_totalmente: pf.pago_totalmente,
        data_pagamento: pf.data_pagamento,
        observacoes: pf.observacoes,
      }));
      await client.from('pagamentos_fatura_responsavel').upsert(rows);
    }

    // 8. Configurações
    if (data.configuracoes) {
      await client.from('configuracoes_usuario').upsert({
        chave_pix: data.configuracoes.chavePix,
        dono_nome: data.configuracoes.donoNome,
        tema_escuro: data.configuracoes.temaEscuro,
      });
    }

    return true;
  } catch (err) {
    console.error('Erro na sincronização completa para o Supabase:', err);
    return false;
  }
}

// --------------------------------------------------------------------
// OPERAÇÕES GRANULARES DIRETAS
// --------------------------------------------------------------------

export async function cloudUpsertResponsavel(item: Responsavel): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('responsaveis').upsert({
    id: item.id,
    nome: item.nome,
    telefone: item.telefone,
    observacoes: item.observacoes,
    ativo: item.ativo,
    is_owner: item.is_owner,
  });
}

export async function cloudDeleteResponsavel(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('responsaveis').delete().eq('id', id);
}

export async function cloudUpsertCartao(item: CartaoCredito): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('cartoes').upsert({
    id: item.id,
    nome: item.nome,
    apelido: item.apelido,
    dia_fechamento: item.dia_fechamento,
    dia_vencimento: item.dia_vencimento,
    limite: item.limite,
    cor: item.cor,
    ativo: item.ativo,
  });
}

export async function cloudDeleteCartao(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('cartoes').delete().eq('id', id);
}

export async function cloudUpsertDespesaComParcelas(
  despesa: DespesaCartao,
  parcelas: ParcelaCartao[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  await client.from('despesas_cartao').upsert({
    id: despesa.id,
    cartao_id: despesa.cartao_id,
    responsavel_id: despesa.responsavel_id,
    descricao: despesa.descricao,
    categoria: despesa.categoria,
    valor_total: despesa.valor_total,
    total_parcelas: despesa.total_parcelas,
    data_compra: despesa.data_compra,
    primeiro_mes: despesa.primeiro_mes,
    observacoes: despesa.observacoes,
  });

  if (parcelas.length > 0) {
    const rows = parcelas.map((p) => ({
      id: p.id,
      despesa_id: p.despesa_id,
      cartao_id: p.cartao_id,
      responsavel_id: p.responsavel_id,
      numero_parcela: p.numero_parcela,
      total_parcelas: p.total_parcelas,
      mes_fatura: p.mes_fatura,
      mes_original: p.mes_original,
      valor: p.valor,
      paga: p.paga,
      data_pagamento: p.data_pagamento,
      antecipada: p.antecipada,
    }));
    await client.from('parcelas_cartao').upsert(rows);
  }
}

export async function cloudDeleteDespesa(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('despesas_cartao').delete().eq('id', id);
}

export async function cloudUpdateParcela(parcela: ParcelaCartao): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('parcelas_cartao').upsert({
    id: parcela.id,
    despesa_id: parcela.despesa_id,
    cartao_id: parcela.cartao_id,
    responsavel_id: parcela.responsavel_id,
    numero_parcela: parcela.numero_parcela,
    total_parcelas: parcela.total_parcelas,
    mes_fatura: parcela.mes_fatura,
    mes_original: parcela.mes_original,
    valor: parcela.valor,
    paga: parcela.paga,
    data_pagamento: parcela.data_pagamento,
    antecipada: parcela.antecipada,
  });
}

export async function cloudUpsertContaReceber(item: ContaReceber): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('contas_receber').upsert({
    id: item.id,
    descricao: item.descricao,
    pagador_nome: item.pagador_nome,
    responsavel_id: item.responsavel_id,
    categoria: item.categoria,
    valor: item.valor,
    data_prevista: item.data_prevista,
    mes_competencia: item.mes_competencia,
    recorrencia: item.recorrencia,
    dia_fixo: item.dia_fixo,
    divida_id: item.divida_id,
    total_parcelas: item.total_parcelas,
    numero_parcela: item.numero_parcela,
    status: item.status,
    valor_recebido: item.valor_recebido,
    data_recebimento: item.data_recebimento,
    observacoes: item.observacoes,
  });
}

export async function cloudDeleteContaReceber(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('contas_receber').delete().eq('id', id);
}

export async function cloudUpsertContaPagar(item: ContaPagar): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('contas_pagar').upsert({
    id: item.id,
    descricao: item.descricao,
    categoria: item.categoria,
    valor: item.valor,
    data_vencimento: item.data_vencimento,
    mes_competencia: item.mes_competencia,
    recorrencia: item.recorrencia,
    total_parcelas: item.total_parcelas,
    numero_parcela: item.numero_parcela,
    status: item.status,
    valor_pago: item.valor_pago,
    data_pagamento: item.data_pagamento,
    observacoes: item.observacoes,
  });
}

export async function cloudDeleteContaPagar(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('contas_pagar').delete().eq('id', id);
}

export async function cloudUpsertPagamentoFatura(
  item: PagamentoFaturaResponsavel
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('pagamentos_fatura_responsavel').upsert({
    id: item.id,
    cartao_id: item.cartao_id,
    responsavel_id: item.responsavel_id,
    mes_fatura: item.mes_fatura,
    valor_devido: item.valor_devido,
    valor_pago: item.valor_pago,
    pago_totalmente: item.pago_totalmente,
    data_pagamento: item.data_pagamento,
    observacoes: item.observacoes,
  });
}

export async function cloudUpsertConfiguracoes(
  configs: StorageData['configuracoes']
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('configuracoes_usuario').upsert({
    chave_pix: configs.chavePix,
    dono_nome: configs.donoNome,
    tema_escuro: configs.temaEscuro,
  });
}

/**
 * Inscreve no canal Supabase Realtime para sincronização automática entre celulares e computadores
 */
export function setupRealtimeSubscription(onRemoteChange: () => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel('public:meu_controle_financeiro')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      onRemoteChange();
    })
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
