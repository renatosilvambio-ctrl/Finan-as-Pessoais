import React, { useState, useMemo } from 'react';
import {
  FileText,
  Send,
  Copy,
  Printer,
  Check,
  User,
  CreditCard,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/currency';
import { formatMonthYear } from '../../utils/dateUtils';
import { shareViaWhatsApp, buildWhatsAppReportText } from '../../utils/whatsapp';

export const ReportsView: React.FC = () => {
  const {
    mesSelecionado,
    responsaveis,
    cartoes,
    despesas,
    parcelas,
    resumoMes,
    configuracoes,
  } = useFinance();

  const [responsavelSelecionadoId, setResponsavelSelecionadoId] = useState<string>(
    responsaveis[0]?.id || ''
  );
  const [copiado, setCopiado] = useState(false);

  const responsavel = responsaveis.find((r) => r.id === responsavelSelecionadoId);

  // Parcelas for selected person and month
  const parcelasPessoa = useMemo(() => {
    return parcelas.filter(
      (p) => p.mes_fatura === mesSelecionado && p.responsavel_id === responsavelSelecionadoId
    );
  }, [parcelas, mesSelecionado, responsavelSelecionadoId]);

  const reportItems = useMemo(() => {
    return parcelasPessoa.map((p) => {
      const desp = despesas.find((d) => d.id === p.despesa_id);
      return {
        descricao: desp?.descricao || 'Despesa',
        parcelaAtual: p.numero_parcela,
        totalParcelas: p.total_parcelas,
        valor: p.valor,
        paga: p.paga,
      };
    });
  }, [parcelasPessoa, despesas]);

  const subtotalPessoa = useMemo(() => {
    return parcelasPessoa.reduce((sum, p) => sum + p.valor, 0);
  }, [parcelasPessoa]);

  const totalPagoPessoa = useMemo(() => {
    return parcelasPessoa.filter((p) => p.paga).reduce((sum, p) => sum + p.valor, 0);
  }, [parcelasPessoa]);

  const totalPendentePessoa = subtotalPessoa - totalPagoPessoa;

  // Build the message text
  const textoWhatsApp = useMemo(() => {
    if (!responsavel) return '';
    return buildWhatsAppReportText({
      nomeResponsavel: responsavel.nome,
      mesFatura: mesSelecionado,
      itens: reportItems,
      subtotal: subtotalPessoa,
      totalPago: totalPagoPessoa,
      totalPendente: totalPendentePessoa,
      chavePix: configuracoes.chavePix,
    });
  }, [
    responsavel,
    mesSelecionado,
    reportItems,
    subtotalPessoa,
    totalPagoPessoa,
    totalPendentePessoa,
    configuracoes.chavePix,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(textoWhatsApp);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleShareWhatsApp = async () => {
    await shareViaWhatsApp(textoWhatsApp, responsavel?.telefone);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Selector & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#123B67] dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1677E8]" />
              Relatório de Fatura para WhatsApp
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Gere demonstrativos detalhados para cada pessoa com valor a pagar e chave PIX
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={responsavelSelecionadoId}
              onChange={(e) => setResponsavelSelecionadoId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-[#17212F] dark:text-slate-200"
            >
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome} {r.is_owner ? '(Titular)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Enviar no WhatsApp
          </button>

          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#123B67] hover:bg-[#0e2f52] text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copiado ? 'Copiado!' : 'Copiar Texto'}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 hover:bg-[#E8F2FF] text-[#123B67] dark:text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Visual Report Sheet (Printable A4 / Card Preview) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm p-6 max-w-xl mx-auto font-sans">
        {/* Printable Header */}
        <div className="border-b-2 border-[#1677E8] pb-4 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1677E8]">
              Meu Controle Financeiro
            </span>
            <h1 className="text-xl font-black text-[#123B67] dark:text-white uppercase tracking-tight">
              Fatura — {formatMonthYear(mesSelecionado)}
            </h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#64748B] block">Responsável:</span>
            <strong className="text-sm font-bold text-[#123B67] dark:text-white">
              {responsavel?.nome}
            </strong>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-2 mb-5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] pb-1 border-b border-[#E2E8F0] dark:border-slate-800 flex justify-between">
            <span>Descrição do Lançamento</span>
            <span>Valor</span>
          </div>

          {reportItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#64748B]">
              Nenhuma despesa registrada para {responsavel?.nome} nesta fatura.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
              {reportItems.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#17212F] dark:text-slate-200 block">
                      {item.descricao}
                      {item.totalParcelas > 1 && (
                        <span className="ml-1 text-[#64748B] font-normal">
                          ({item.parcelaAtual}/{item.totalParcelas})
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {item.paga ? 'Quitado' : 'Pendente'}
                    </span>
                  </div>
                  <strong className="text-[#17212F] dark:text-white font-bold tabular-nums">
                    {formatCurrency(item.valor)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals Summary */}
        <div className="bg-[#F4F7FB] dark:bg-slate-800/60 rounded-xl p-4 space-y-1.5 border border-[#E2E8F0] dark:border-slate-800">
          <div className="flex justify-between text-xs text-[#64748B] dark:text-slate-400">
            <span>Subtotal Geral:</span>
            <strong className="tabular-nums text-[#17212F] dark:text-white">
              {formatCurrency(subtotalPessoa)}
            </strong>
          </div>

          {totalPagoPessoa > 0 && (
            <div className="flex justify-between text-xs text-[#16A765]">
              <span>Valor já pago:</span>
              <strong className="tabular-nums">− {formatCurrency(totalPagoPessoa)}</strong>
            </div>
          )}

          <div className="flex justify-between text-sm font-extrabold text-[#123B67] dark:text-blue-300 pt-2 border-t border-[#E2E8F0] dark:border-slate-700">
            <span>TOTAL A PAGAR:</span>
            <span className="tabular-nums text-base text-[#1677E8] dark:text-blue-400">{formatCurrency(totalPendentePessoa)}</span>
          </div>
        </div>

        {/* Chave PIX */}
        {configuracoes.chavePix && totalPendentePessoa > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-[#E8F2FF] dark:bg-blue-950/40 border border-[#BFDBFE] dark:border-blue-800/60 text-xs">
            <span className="text-[#123B67] dark:text-blue-300 font-bold block mb-0.5">
              Chave PIX para pagamento:
            </span>
            <code className="font-mono text-[#1677E8] dark:text-blue-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-[#BFDBFE] dark:border-blue-700 select-all block text-center font-bold">
              {configuracoes.chavePix}
            </code>
          </div>
        )}

        {/* WhatsApp Preview Text Box */}
        <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 no-print">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
              Texto Formatado para o WhatsApp:
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-[#1677E8] font-semibold hover:underline cursor-pointer"
            >
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <pre className="p-3 bg-[#123B67] text-blue-100 rounded-xl text-[11px] font-mono whitespace-pre-wrap select-all overflow-x-auto max-h-48 border border-blue-900">
            {textoWhatsApp}
          </pre>
        </div>
      </div>
    </div>
  );
};
