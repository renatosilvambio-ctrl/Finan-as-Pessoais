import React from 'react';
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  UserCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/currency';
import { formatMonthYear, formatDateBR } from '../../utils/dateUtils';
import { shareViaWhatsApp, buildWhatsAppReportText } from '../../utils/whatsapp';

export const DashboardView: React.FC = () => {
  const {
    mesSelecionado,
    resumoMes,
    responsaveis,
    parcelas,
    despesas,
    cartoes,
    contasPagar,
    contasReceber,
    setActiveTab,
    configuracoes,
  } = useFinance();

  // Compute breakdown per responsible person for the selected month
  const parcelasDoMes = parcelas.filter((p) => p.mes_fatura === mesSelecionado);

  const breakdownResponsaveis = responsaveis.map((resp) => {
    const parcelasPessoa = parcelasDoMes.filter((p) => p.responsavel_id === resp.id);
    const totalDespesas = parcelasPessoa.reduce((sum, p) => sum + p.valor, 0);
    const totalPago = parcelasPessoa.filter((p) => p.paga).reduce((sum, p) => sum + p.valor, 0);
    const totalPendente = totalDespesas - totalPago;
    const porcentagem =
      resumoMes.total_fatura_cartao > 0
        ? (totalDespesas / resumoMes.total_fatura_cartao) * 100
        : 0;

    return {
      responsavel: resp,
      totalDespesas,
      totalPago,
      totalPendente,
      porcentagem,
      quantidadeItens: parcelasPessoa.length,
      parcelasPessoa,
    };
  }).filter((item) => item.totalDespesas > 0 || item.responsavel.is_owner);

  // Quick WhatsApp sharing action from dashboard
  const handleQuickWhatsAppShare = async (item: (typeof breakdownResponsaveis)[0]) => {
    const reportItems = item.parcelasPessoa.map((p) => {
      const desp = despesas.find((d) => d.id === p.despesa_id);
      return {
        descricao: desp?.descricao || 'Despesa',
        parcelaAtual: p.numero_parcela,
        totalParcelas: p.total_parcelas,
        valor: p.valor,
        paga: p.paga,
      };
    });

    const text = buildWhatsAppReportText({
      nomeResponsavel: item.responsavel.nome,
      mesFatura: mesSelecionado,
      itens: reportItems,
      subtotal: item.totalDespesas,
      totalPago: item.totalPago,
      totalPendente: item.totalPendente,
      chavePix: configuracoes.chavePix,
    });

    await shareViaWhatsApp(text, item.responsavel.telefone);
  };

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Saldo Principal Card - Tema Claro Clean */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#123B67] font-bold block">
              Previsão Financeira Líquida
            </span>
            <span className="text-xs text-[#64748B] font-medium">
              {formatMonthYear(mesSelecionado)}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              resumoMes.saldo_previsto >= 0
                ? 'bg-[#E8F8F0] text-[#16A765] border border-[#BBEBD0]'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{resumoMes.saldo_previsto >= 0 ? 'Superávit' : 'Déficit'}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-[#1677E8]">
            {formatCurrency(resumoMes.saldo_previsto)}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Saldo previsto = Recebimentos previstos ({formatCurrency(resumoMes.total_a_receber)}) − Despesas pessoais ({formatCurrency(resumoMes.total_minha_parte_cartao + resumoMes.total_contas_pagar)})
          </p>
        </div>

        {/* Realized vs Projected strip */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E2E8F0] text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Saldo Realizado (Caixa):</span>
            <strong className="text-sm font-bold tabular-nums text-[#123B67]">
              {formatCurrency(resumoMes.saldo_realizado)}
            </strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Terceiros a Reembolsar:</span>
            <strong className="text-sm font-bold tabular-nums text-[#1677E8]">
              {formatCurrency(resumoMes.total_terceiros_pendente)}
            </strong>
          </div>
        </div>
      </div>

      {/* Grid of Main Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total da Fatura */}
        <div
          onClick={() => setActiveTab('cartao')}
          className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm cursor-pointer hover:border-[#1677E8]/50 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
              Fatura do Cartão
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E8F2FF] text-[#1677E8] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#123B67] tabular-nums tracking-tight">
            {formatCurrency(resumoMes.total_fatura_cartao)}
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex justify-between">
            <span>Minha parte: <strong className="text-[#17212F]">{formatCurrency(resumoMes.total_minha_parte_cartao)}</strong></span>
            <span>Terceiros: <strong className="text-[#1677E8]">{formatCurrency(resumoMes.total_terceiros_cartao)}</strong></span>
          </div>
        </div>

        {/* Total a Receber */}
        <div
          onClick={() => setActiveTab('receber')}
          className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm cursor-pointer hover:border-[#1677E8]/50 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
              Total a Receber
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E8F2FF] text-[#1677E8] flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1677E8] tabular-nums tracking-tight">
            {formatCurrency(resumoMes.total_a_receber)}
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex justify-between">
            <span>Já recebido: <strong className="text-[#16A765]">{formatCurrency(resumoMes.total_recebido)}</strong></span>
            <span>Pendente: <strong className="text-[#1677E8]">{formatCurrency(resumoMes.total_receber_pendente)}</strong></span>
          </div>
        </div>

        {/* Total Contas a Pagar */}
        <div
          onClick={() => setActiveTab('contas')}
          className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm cursor-pointer hover:border-rose-400/50 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
              Contas a Pagar
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums tracking-tight">
            {formatCurrency(resumoMes.total_contas_pagar)}
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex justify-between">
            <span>Já pago: <strong className="text-[#16A765]">{formatCurrency(resumoMes.total_contas_pagas)}</strong></span>
            <span>Pendente: <strong className="text-amber-600">{formatCurrency(resumoMes.total_contas_pendentes)}</strong></span>
          </div>
        </div>
      </div>

      {/* Secondary Status Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16A765] mb-0.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Já Recebido</span>
          </div>
          <div className="text-base font-bold text-[#17212F] tabular-nums">
            {formatCurrency(resumoMes.total_recebido)}
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1677E8] mb-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>A Receber</span>
          </div>
          <div className="text-base font-bold text-[#17212F] tabular-nums">
            {formatCurrency(resumoMes.total_receber_pendente)}
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#123B67] mb-0.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Contas Pagas</span>
          </div>
          <div className="text-base font-bold text-[#17212F] tabular-nums">
            {formatCurrency(resumoMes.total_contas_pagas)}
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-0.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Em Atraso</span>
          </div>
          <div className="text-base font-bold text-rose-600 tabular-nums">
            {formatCurrency(resumoMes.total_contas_atrasadas)}
          </div>
        </div>
      </div>

      {/* Resumo por Responsável (Módulo de Cartão Compartilhado) */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#123B67] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#1677E8]" />
              Divisão da Fatura por Responsável
            </h3>
            <p className="text-xs text-[#64748B]">
              Participação de cada pessoa nos gastos do cartão de {formatMonthYear(mesSelecionado)}
            </p>
          </div>
        </div>

        {breakdownResponsaveis.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#64748B]">
            Nenhuma despesa de cartão cadastrada para este mês.
          </div>
        ) : (
          <div className="space-y-3">
            {breakdownResponsaveis.map((item) => (
              <div
                key={item.responsavel.id}
                className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#D0E2FF] transition"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E8F2FF] text-[#1677E8] flex items-center justify-center font-bold text-xs">
                      {item.responsavel.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#17212F] block">
                        {item.responsavel.nome}
                        {item.responsavel.is_owner && (
                          <span className="ml-1.5 text-[10px] font-semibold text-[#1677E8] bg-[#E8F2FF] px-1.5 py-0.5 rounded">
                            Titular
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {item.quantidadeItens} {item.quantidadeItens === 1 ? 'lançamento' : 'lançamentos'} ·{' '}
                        {item.porcentagem.toFixed(1)}% da fatura
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-[#123B67] tabular-nums">
                      {formatCurrency(item.totalDespesas)}
                    </div>
                    {item.totalPendente > 0 ? (
                      <span className="text-[11px] font-medium text-amber-600">
                        Pendente: {formatCurrency(item.totalPendente)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[#16A765]">
                        100% Quitado
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-[#1677E8] rounded-full transition-all duration-300"
                    style={{
                      width: `${item.totalDespesas > 0 ? (item.totalPago / item.totalDespesas) * 100 : 0}%`,
                    }}
                  />
                </div>

                {/* Action button if third party */}
                {!item.responsavel.is_owner && item.totalDespesas > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">
                      Pago: {formatCurrency(item.totalPago)}
                    </span>
                    <button
                      onClick={() => handleQuickWhatsAppShare(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E8F2FF] hover:bg-[#D9E9FF] text-[#1677E8] text-xs font-semibold active:scale-95 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Cobrar no WhatsApp
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Próximas Contas a Vencer no Mês */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-[#123B67]">
            Vencimentos em {formatMonthYear(mesSelecionado)}
          </h3>
          <button
            onClick={() => setActiveTab('contas')}
            className="text-xs font-semibold text-[#1677E8] hover:underline cursor-pointer"
          >
            Ver todas
          </button>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {contasPagar
            .filter((c) => c.mes_competencia === mesSelecionado)
            .slice(0, 4)
            .map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#17212F] block">
                    {c.descricao}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Vencimento: {formatDateBR(c.data_vencimento)} · {c.categoria}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#17212F] tabular-nums block">
                    {formatCurrency(c.valor)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      c.status === 'pago'
                        ? 'text-[#16A765]'
                        : c.status === 'atrasado'
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          {contasPagar.filter((c) => c.mes_competencia === mesSelecionado).length === 0 && (
            <div className="py-4 text-center text-xs text-[#64748B]">
              Nenhuma conta a pagar cadastrada para este mês.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
