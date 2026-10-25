import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
  Trash2,
  Edit2,
  DollarSign,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ContaReceber } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatMonthYear, formatDateBR } from '../../utils/dateUtils';
import { ReceivableModal } from '../modals/ReceivableModal';

export const ReceivablesView: React.FC = () => {
  const {
    mesSelecionado,
    contasReceber,
    atualizarContaReceber,
    excluirContaReceber,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaReceber | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');

  // Filter receivables for this month (or debts active this month)
  const contasDoMes = useMemo(() => {
    return contasReceber.filter((c) => c.mes_competencia === mesSelecionado);
  }, [contasReceber, mesSelecionado]);

  const filteredContas = useMemo(() => {
    return contasDoMes.filter((c) => {
      if (categoriaFiltro !== 'todos' && c.categoria !== categoriaFiltro) return false;
      if (statusFiltro !== 'todos' && c.status !== statusFiltro) return false;
      return true;
    });
  }, [contasDoMes, categoriaFiltro, statusFiltro]);

  // Totals for this month
  const totalPrevisto = useMemo(() => {
    return contasDoMes.reduce((sum, c) => sum + c.valor, 0);
  }, [contasDoMes]);

  const totalRecebido = useMemo(() => {
    return contasDoMes.reduce((sum, c) => sum + (c.valor_recebido || 0), 0);
  }, [contasDoMes]);

  const totalPendente = totalPrevisto - totalRecebido;

  // Track installment debts summary (e.g., Carlos 10x)
  const dividasParceladas = useMemo(() => {
    const map = new Map<string, { dividaId: string; descricao: string; pagador: string; parcelas: ContaReceber[] }>();
    contasReceber.forEach((c) => {
      if (c.divida_id) {
        if (!map.has(c.divida_id)) {
          map.set(c.divida_id, {
            dividaId: c.divida_id,
            descricao: c.descricao,
            pagador: c.pagador_nome,
            parcelas: [],
          });
        }
        map.get(c.divida_id)!.parcelas.push(c);
      }
    });

    return Array.from(map.values()).map((g) => {
      const valorTotal = g.parcelas.reduce((s, p) => s + p.valor, 0);
      const totalRecebido = g.parcelas.reduce((s, p) => s + (p.valor_recebido || 0), 0);
      const saldoRestante = valorTotal - totalRecebido;
      const pagasCount = g.parcelas.filter((p) => p.status === 'recebido').length;
      const totalCount = g.parcelas.length;

      // Find next due parcel
      const proximas = g.parcelas
        .filter((p) => p.status === 'a_receber')
        .sort((a, b) => a.data_prevista.localeCompare(b.data_prevista));
      const proximoVencimento = proximas[0]?.data_prevista;

      return {
        ...g,
        valorTotal,
        totalRecebido,
        saldoRestante,
        pagasCount,
        totalCount,
        proximoVencimento,
      };
    });
  }, [contasReceber]);

  const handleToggleRecebido = (conta: ContaReceber) => {
    if (conta.status === 'recebido') {
      atualizarContaReceber(conta.id, {
        status: 'a_receber',
        valor_recebido: 0,
        data_recebimento: undefined,
      });
    } else {
      atualizarContaReceber(conta.id, {
        status: 'recebido',
        valor_recebido: conta.valor,
        data_recebimento: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleDelete = (contaId: string, desc: string) => {
    if (confirm(`Deseja excluir o recebimento "${desc}"?`)) {
      excluirContaReceber(contaId);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* Header Summary */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-[#1677E8]" />
              <h2 className="text-lg font-bold text-[#123B67]">
                Contas a Receber — {formatMonthYear(mesSelecionado)}
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Salários, 5º dia útil, vales, reembolsos e dívidas a receber
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
            Novo Recebimento
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#E2E8F0]">
          <div>
            <span className="text-[11px] text-[#64748B] block">Total Previsto:</span>
            <strong className="text-sm sm:text-base font-bold text-[#123B67] tabular-nums">
              {formatCurrency(totalPrevisto)}
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-[#16A765] block">Já Recebido:</span>
            <strong className="text-sm sm:text-base font-bold text-[#16A765] tabular-nums">
              {formatCurrency(totalRecebido)}
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-[#1677E8] block">Ainda Pendente:</span>
            <strong className="text-sm sm:text-base font-bold text-[#1677E8] tabular-nums">
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
          <option value="Salário">Salário</option>
          <option value="Vale / Adiantamento">Vale / Adiantamento</option>
          <option value="Dívida de Terceiros">Dívida de Terceiros</option>
          <option value="Empréstimo">Empréstimo</option>
          <option value="Reembolso">Reembolso</option>
          <option value="Venda">Venda</option>
          <option value="Outros">Outros</option>
        </select>

        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="px-2.5 py-1 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#17212F] focus:border-[#1677E8] outline-none"
        >
          <option value="todos">Todos Status</option>
          <option value="a_receber">A Receber</option>
          <option value="recebido">Recebido</option>
          <option value="parcial">Parcial</option>
          <option value="atrasado">Atrasado</option>
        </select>
      </div>

      {/* Dívidas Parceladas de Terceiros (se existirem) */}
      {dividasParceladas.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#1677E8]" />
            <h3 className="text-sm font-bold text-[#123B67]">
              Dívidas Parceladas de Terceiros
            </h3>
          </div>

          <div className="space-y-2.5">
            {dividasParceladas.map((div) => (
              <div
                key={div.dividaId}
                className="p-3 rounded-xl border border-[#E2E8F0] bg-white text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <strong className="text-[#17212F] font-bold block text-sm">
                      {div.descricao} ({div.pagador})
                    </strong>
                    <span className="text-[11px] text-[#64748B]">
                      {div.pagasCount} de {div.totalCount} parcelas quitadas
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#1677E8] tabular-nums block">
                      Saldo restante: {formatCurrency(div.saldoRestante)}
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      Total: {formatCurrency(div.valorTotal)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden mt-1 mb-2">
                  <div
                    className="h-full bg-[#1677E8] rounded-full"
                    style={{
                      width: `${div.valorTotal > 0 ? (div.totalRecebido / div.valorTotal) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-[#64748B]">
                  <span>
                    Próximo vencimento:{' '}
                    <strong className="text-[#17212F]">{div.proximoVencimento ? formatDateBR(div.proximoVencimento) : 'Quitada'}</strong>
                  </span>
                  <span>Recebido: <strong className="text-[#16A765]">{formatCurrency(div.totalRecebido)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List of Receivables for Selected Month */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#123B67]">
            Recebimentos do Mês
          </h3>
          <span className="text-xs text-[#64748B]">
            {filteredContas.length} {filteredContas.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {filteredContas.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#64748B]">
            Nenhum recebimento cadastrado para este mês com os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filteredContas.map((c) => {
              const isRecebido = c.status === 'recebido';

              return (
                <div
                  key={c.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleRecebido(c)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#1677E8] shrink-0 cursor-pointer"
                      title={isRecebido ? 'Marcar como a receber' : 'Marcar como recebido'}
                    >
                      {isRecebido ? (
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
                        <span>{c.pagador_nome}</span>
                        <span>·</span>
                        <span>{c.categoria}</span>
                        <span>·</span>
                        <span>Previsto: {formatDateBR(c.data_prevista)}</span>
                        {c.recorrencia === 'quinto_dia_util' && (
                          <span className="text-[10px] bg-[#E8F2FF] text-[#1677E8] px-1.5 py-0.2 rounded font-semibold">
                            5º dia útil
                          </span>
                        )}
                        {c.total_parcelas && c.total_parcelas > 1 && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-semibold">
                            {c.numero_parcela}/{c.total_parcelas}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm font-bold tabular-nums ${
                          isRecebido
                            ? 'text-[#16A765] font-extrabold'
                            : 'text-[#17212F]'
                        }`}
                      >
                        {formatCurrency(c.valor)}
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          isRecebido ? 'text-[#16A765]' : 'text-[#1677E8]'
                        }`}
                      >
                        {isRecebido ? 'Recebido' : 'A Receber'}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          setEditingConta(c);
                          setIsModalOpen(true);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#1677E8] hover:bg-slate-100"
                        title="Editar recebimento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.descricao)}
                        className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-rose-600 hover:bg-slate-100"
                        title="Excluir recebimento"
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

      <ReceivableModal
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
