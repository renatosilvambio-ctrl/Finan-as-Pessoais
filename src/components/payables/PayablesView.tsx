import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ContaPagar } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatMonthYear, formatDateBR } from '../../utils/dateUtils';
import { PayableModal } from '../modals/PayableModal';

export const PayablesView: React.FC = () => {
  const {
    mesSelecionado,
    contasPagar,
    atualizarContaPagar,
    excluirContaPagar,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaPagar | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');

  // Filter for this month
  const contasDoMes = useMemo(() => {
    return contasPagar.filter((c) => c.mes_competencia === mesSelecionado);
  }, [contasPagar, mesSelecionado]);

  const filteredContas = useMemo(() => {
    return contasDoMes.filter((c) => {
      if (categoriaFiltro !== 'todos' && c.categoria !== categoriaFiltro) return false;
      if (statusFiltro !== 'todos' && c.status !== statusFiltro) return false;
      return true;
    });
  }, [contasDoMes, categoriaFiltro, statusFiltro]);

  // Metrics
  const totalContas = useMemo(() => {
    return contasDoMes.reduce((sum, c) => sum + c.valor, 0);
  }, [contasDoMes]);

  const totalPago = useMemo(() => {
    return contasDoMes.reduce((sum, c) => sum + (c.valor_pago || 0), 0);
  }, [contasDoMes]);

  const totalPendente = totalContas - totalPago;

  const totalAtrasadas = useMemo(() => {
    return contasDoMes
      .filter((c) => c.status === 'atrasado')
      .reduce((sum, c) => sum + c.valor, 0);
  }, [contasDoMes]);

  const handleTogglePago = (conta: ContaPagar) => {
    if (conta.status === 'pago') {
      atualizarContaPagar(conta.id, {
        status: 'pendente',
        valor_pago: 0,
        data_pagamento: undefined,
      });
    } else {
      atualizarContaPagar(conta.id, {
        status: 'pago',
        valor_pago: conta.valor,
        data_pagamento: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleDelete = (contaId: string, desc: string) => {
    if (confirm(`Deseja excluir permanentemente a conta "${desc}"?`)) {
      excluirContaPagar(contaId);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* Header Summary */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-bold text-[#123B67]">
                Contas a Pagar — {formatMonthYear(mesSelecionado)}
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Despesas pessoais fixas e variáveis fora do cartão de crédito
            </p>
          </div>

          <button
            onClick={() => {
              setEditingConta(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1265c7] text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nova Conta
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#E2E8F0]">
          <div>
            <span className="text-[11px] text-[#64748B] block">Total a Pagar:</span>
            <strong className="text-sm sm:text-base font-bold text-[#123B67] tabular-nums">
              {formatCurrency(totalContas)}
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-[#16A765] block">Já Pago:</span>
            <strong className="text-sm sm:text-base font-bold text-[#16A765] tabular-nums">
              {formatCurrency(totalPago)}
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-rose-600 block">Pendente:</span>
            <strong className="text-sm sm:text-base font-bold text-rose-600 tabular-nums">
              {formatCurrency(totalPendente)}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-3 border border-[#E2E8F0] shadow-sm flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-[#1677E8]" />
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="px-2.5 py-1 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#17212F] focus:border-[#1677E8] outline-none"
        >
          <option value="todos">Todas Categorias</option>
          <option value="Aluguel">Aluguel</option>
          <option value="Condomínio">Condomínio</option>
          <option value="Energia">Energia</option>
          <option value="Água">Água</option>
          <option value="Internet">Internet</option>
          <option value="Celular">Celular</option>
          <option value="Seguro">Seguro</option>
          <option value="Financiamento">Financiamento</option>
          <option value="Assinaturas">Assinaturas</option>
          <option value="Supermercado">Supermercado</option>
          <option value="Saúde">Saúde</option>
          <option value="Dívidas">Dívidas</option>
          <option value="Outros">Outros</option>
        </select>

        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="px-2.5 py-1 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#17212F] focus:border-[#1677E8] outline-none"
        >
          <option value="todos">Todos Status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Já Pago</option>
          <option value="parcial">Parcial</option>
          <option value="atrasado">Em Atraso</option>
        </select>
      </div>

      {/* List of Payables */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#123B67]">
            Contas do Mês
          </h3>
          <span className="text-xs text-[#64748B]">
            {filteredContas.length} {filteredContas.length === 1 ? 'conta' : 'contas'}
          </span>
        </div>

        {filteredContas.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            Nenhuma conta a pagar encontrada com os filtros selecionados para {formatMonthYear(mesSelecionado)}.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filteredContas.map((c) => {
              const isPago = c.status === 'pago';

              return (
                <div
                  key={c.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleTogglePago(c)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#16A765] shrink-0 cursor-pointer"
                      title={isPago ? 'Marcar como pendente' : 'Marcar como pago'}
                    >
                      {isPago ? (
                        <CheckCircle2 className="w-5 h-5 text-[#16A765] fill-[#E8F8F0]" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="font-bold text-[#17212F] truncate text-sm">
                        {c.descricao}
                      </div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 flex-wrap">
                        <span>{c.categoria}</span>
                        <span>·</span>
                        <span>Vencimento: {formatDateBR(c.data_vencimento)}</span>
                        {c.recorrencia === 'mensal' && (
                          <span className="text-[10px] bg-[#E8F2FF] text-[#1677E8] px-1.5 py-0.2 rounded font-medium">
                            Mensal Fixa
                          </span>
                        )}
                        {c.data_pagamento && (
                          <span className="text-[10px] text-[#16A765] font-semibold">
                            Pago em {formatDateBR(c.data_pagamento)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm font-bold tabular-nums ${
                          isPago
                            ? 'text-[#64748B] line-through'
                            : 'text-[#17212F]'
                        }`}
                      >
                        {formatCurrency(c.valor)}
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          isPago
                            ? 'text-[#16A765]'
                            : c.status === 'atrasado'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          setEditingConta(c);
                          setIsModalOpen(true);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#1677E8] hover:bg-slate-100"
                        title="Editar conta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.descricao)}
                        className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-rose-600 hover:bg-slate-100"
                        title="Excluir conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PayableModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingConta(null);
        }}
        editingConta={editingConta}
      />
    </div>
  );
};
