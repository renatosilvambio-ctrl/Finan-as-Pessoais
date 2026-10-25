import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/currency';
import { formatMonthShort, formatMonthYear } from '../../utils/dateUtils';

export const ForecastView: React.FC = () => {
  const { previsao12Meses, setMesSelecionado, setActiveTab } = useFinance();
  const [mesDetalhe, setMesDetalhe] = useState<string | null>(null);

  // Prepare chart data
  const chartData = previsao12Meses.map((item) => ({
    name: formatMonthShort(item.mes),
    mes: item.mes,
    Recebimentos: item.total_a_receber,
    DespesasPessoais: item.total_minha_parte_cartao + item.total_contas_pagar,
    SaldoPrevisto: item.saldo_previsto,
    SaldoAcumulado: item.saldo_acumulado,
  }));

  const itemDetalhe = previsao12Meses.find((p) => p.mes === mesDetalhe);

  return (
    <div className="space-y-4">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-[#1677E8]" />
          <h2 className="text-lg font-bold text-[#123B67] dark:text-white">
            Previsão Financeira dos Próximos 12 Meses
          </h2>
        </div>
        <p className="text-xs text-[#64748B] dark:text-slate-400">
          Projeção mês a mês considerando receitas previstas, contas a pagar e parcelas ativas no cartão.
        </p>
      </div>

      {/* Chart Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
          Fluxo de Caixa Projetado (R$)
        </h3>

        <div className="w-full h-64 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload[0]) {
                  setMesDetalhe(state.activePayload[0].payload.mes);
                }
              }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#94A3B8"
                tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: unknown) => [formatCurrency(Number(val)), '']}
                contentStyle={{
                  borderRadius: '12px',
                  backgroundColor: '#123B67',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <ReferenceLine y={0} stroke="#E2E8F0" />
              <Bar dataKey="Recebimentos" fill="#1677E8" radius={[4, 4, 0, 0]} name="Recebimentos" />
              <Bar dataKey="DespesasPessoais" fill="#EF4444" radius={[4, 4, 0, 0]} name="Despesas Totais" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-center text-[#64748B] mt-2">
          Toque em uma barra para ver o detalhamento do mês
        </p>
      </div>

      {/* Detail card if a month is clicked */}
      {itemDetalhe && (
        <div className="bg-[#E8F2FF] dark:bg-blue-950/40 rounded-2xl p-4 border border-[#BFDBFE] dark:border-blue-800 animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-[#123B67] dark:text-blue-200">
              Detalhamento de {formatMonthYear(itemDetalhe.mes)}
            </h4>
            <button
              onClick={() => {
                setMesSelecionado(itemDetalhe.mes);
                setActiveTab('inicio');
              }}
              className="text-xs font-bold text-[#1677E8] hover:underline"
            >
              Abrir este mês no Dashboard →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <span className="text-[#64748B] block text-[11px]">Receitas:</span>
              <strong className="text-[#1677E8] font-bold tabular-nums">
                {formatCurrency(itemDetalhe.total_a_receber)}
              </strong>
            </div>
            <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <span className="text-[#64748B] block text-[11px]">Minha Fatura Cartão:</span>
              <strong className="text-purple-600 font-bold tabular-nums">
                {formatCurrency(itemDetalhe.total_minha_parte_cartao)}
              </strong>
            </div>
            <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <span className="text-[#64748B] block text-[11px]">Contas a Pagar:</span>
              <strong className="text-rose-600 font-bold tabular-nums">
                {formatCurrency(itemDetalhe.total_contas_pagar)}
              </strong>
            </div>
            <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
              <span className="text-[#64748B] block text-[11px]">Saldo Projetado:</span>
              <strong
                className={`font-bold tabular-nums ${
                  itemDetalhe.saldo_previsto >= 0 ? 'text-[#16A765]' : 'text-rose-600'
                }`}
              >
                {formatCurrency(itemDetalhe.saldo_previsto)}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 12-Month Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#123B67] dark:text-white">
            Cronograma Mensal (12 Meses)
          </h3>
          <span className="text-xs text-[#64748B]">Saldo individual e acumulado</span>
        </div>

        <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
          {previsao12Meses.map((item) => (
            <div
              key={item.mes}
              onClick={() => setMesDetalhe(item.mes)}
              className="p-3.5 flex items-center justify-between gap-2 hover:bg-[#F4F7FB] dark:hover:bg-slate-800/40 cursor-pointer transition text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E8F2FF] text-[#1677E8] dark:bg-slate-800 flex items-center justify-center font-bold shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#17212F] dark:text-white block">
                    {formatMonthYear(item.mes)}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Rec: {formatCurrency(item.total_a_receber)} · Desp:{' '}
                    {formatCurrency(item.total_minha_parte_cartao + item.total_contas_pagar)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-sm font-bold tabular-nums ${
                    item.saldo_previsto >= 0
                      ? 'text-[#16A765] dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {item.saldo_previsto >= 0 ? '+' : ''}
                  {formatCurrency(item.saldo_previsto)}
                </div>
                <span className="text-[10px] text-[#64748B] block tabular-nums">
                  Acumulado: {formatCurrency(item.saldo_acumulado)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
