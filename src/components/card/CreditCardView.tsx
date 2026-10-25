import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Share2,
  Trash2,
  Edit2,
  FastForward,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ParcelaCartao, DespesaCartao } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatMonthYear, formatDateBR } from '../../utils/dateUtils';
import { ExpenseModal } from '../modals/ExpenseModal';
import { AdvanceModal } from '../modals/AdvanceModal';
import { SettleShareModal } from '../modals/SettleShareModal';
import { shareViaWhatsApp, buildWhatsAppReportText } from '../../utils/whatsapp';

export const CreditCardView: React.FC = () => {
  const {
    mesSelecionado,
    cartoes,
    responsaveis,
    despesas,
    parcelas,
    togglePagarParcela,
    excluirDespesaCartao,
    configuracoes,
  } = useFinance();

  // Filters
  const [cartaoFiltro, setCartaoFiltro] = useState<string>('todos');
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'pendentes' | 'pagos'>('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<DespesaCartao | null>(null);
  const [advancingParcela, setAdvancingParcela] = useState<ParcelaCartao | null>(null);
  const [settleShareTarget, setSettleShareTarget] = useState<{ respId: string; cardId: string } | null>(null);

  // Expanded persons groups
  const [expandedPersons, setExpandedPersons] = useState<Record<string, boolean>>({});

  // Parcelas for the selected month
  const parcelasMes = useMemo(() => {
    return parcelas.filter((p) => p.mes_fatura === mesSelecionado);
  }, [parcelas, mesSelecionado]);

  // Apply filters
  const filteredParcelas = useMemo(() => {
    return parcelasMes.filter((p) => {
      if (cartaoFiltro !== 'todos' && p.cartao_id !== cartaoFiltro) return false;
      if (responsavelFiltro !== 'todos' && p.responsavel_id !== responsavelFiltro) return false;
      if (statusFiltro === 'pendentes' && p.paga) return false;
      if (statusFiltro === 'pagos' && !p.paga) return false;

      if (categoriaFiltro !== 'todos') {
        const desp = despesas.find((d) => d.id === p.despesa_id);
        if (desp && desp.categoria !== categoriaFiltro) return false;
      }

      return true;
    });
  }, [parcelasMes, cartaoFiltro, responsavelFiltro, statusFiltro, categoriaFiltro, despesas]);

  // Group by responsible person
  const groupedByPerson = useMemo(() => {
    const map = new Map<string, { responsavel: (typeof responsaveis)[0]; itens: ParcelaCartao[]; subtotal: number; pago: number; pendente: number }>();

    filteredParcelas.forEach((p) => {
      const resp = responsaveis.find((r) => r.id === p.responsavel_id) || {
        id: p.responsavel_id,
        nome: 'Desconhecido',
        ativo: true,
        created_at: '',
      };

      if (!map.has(resp.id)) {
        map.set(resp.id, {
          responsavel: resp,
          itens: [],
          subtotal: 0,
          pago: 0,
          pendente: 0,
        });
      }

      const group = map.get(resp.id)!;
      group.itens.push(p);
      group.subtotal += p.valor;
      if (p.paga) {
        group.pago += p.valor;
      } else {
        group.pendente += p.valor;
      }
    });

    return Array.from(map.values());
  }, [filteredParcelas, responsaveis]);

  const toggleExpand = (respId: string) => {
    setExpandedPersons((prev) => ({
      ...prev,
      [respId]: prev[respId] === false ? true : false,
    }));
  };

  const handleSharePersonWhatsApp = async (group: (typeof groupedByPerson)[0]) => {
    const reportItems = group.itens.map((p) => {
      const desp = despesas.find((d) => d.id === p.despesa_id);
      return {
        descricao: desp?.descricao || 'Despesa',
        parcelaAtual: p.numero_parcela,
        totalParcelas: p.total_parcelas,
        valor: p.valor,
        paga: p.paga,
      };
    });

    const activeCard = cartoes.find((c) => c.id === cartaoFiltro);

    const text = buildWhatsAppReportText({
      nomeResponsavel: group.responsavel.nome,
      mesFatura: mesSelecionado,
      nomeCartao: activeCard ? activeCard.nome : undefined,
      itens: reportItems,
      subtotal: group.subtotal,
      totalPago: group.pago,
      totalPendente: group.pendente,
      chavePix: configuracoes.chavePix,
    });

    await shareViaWhatsApp(text, group.responsavel.telefone);
  };

  const handleDeleteExpense = (despesaId: string, desc: string) => {
    if (confirm(`Tem certeza que deseja cancelar e excluir permanentemente a compra "${desc}" e todas as suas parcelas?`)) {
      excluirDespesaCartao(despesaId);
    }
  };

  const totalFaturaFiltro = useMemo(() => {
    return filteredParcelas.reduce((sum, p) => sum + p.valor, 0);
  }, [filteredParcelas]);

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* Top Card Info Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#1677E8]" />
              <h2 className="text-lg font-bold text-[#123B67]">
                Fatura de {formatMonthYear(mesSelecionado)}
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Cartão compartilhado com rateio por responsável
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingDespesa(null);
                setIsExpenseModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1265c7] text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nova Despesa
            </button>
          </div>
        </div>

        {/* Total displayed */}
        <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
          <span className="text-xs font-medium text-[#64748B]">
            Total filtrado ({filteredParcelas.length} lançamentos):
          </span>
          <span className="text-xl font-extrabold text-[#123B67] tabular-nums">
            {formatCurrency(totalFaturaFiltro)}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-3 border border-[#E2E8F0] shadow-sm space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] mb-1">
          <Filter className="w-3.5 h-3.5 text-[#1677E8]" />
          <span>Filtros Rápidos</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Cartão */}
          <select
            value={cartaoFiltro}
            onChange={(e) => setCartaoFiltro(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#17212F] focus:border-[#1677E8] outline-none"
          >
            <option value="todos">Todos os Cartões</option>
            {cartoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          {/* Responsável */}
          <select
            value={responsavelFiltro}
            onChange={(e) => setResponsavelFiltro(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#17212F] focus:border-[#1677E8] outline-none"
          >
            <option value="todos">Todos os Responsáveis</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value as any)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#17212F] focus:border-[#1677E8] outline-none"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendentes">Apenas Pendentes</option>
            <option value="pagos">Apenas Pagos</option>
          </select>

          {/* Categoria */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#17212F] focus:border-[#1677E8] outline-none"
          >
            <option value="todos">Todas Categorias</option>
            <option value="Alimentação">Alimentação</option>
            <option value="Mercado">Mercado</option>
            <option value="Eletrônicos">Eletrônicos</option>
            <option value="Vestuário">Vestuário</option>
            <option value="Saúde">Saúde</option>
            <option value="Casa">Casa</option>
            <option value="Transporte">Transporte</option>
            <option value="Lazer">Lazer</option>
            <option value="Assinatura">Assinatura</option>
          </select>
        </div>
      </div>

      {/* Grouped Invoices by Person */}
      {groupedByPerson.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F0] text-[#64748B] text-sm">
          Nenhuma compra localizada com os filtros selecionados para {formatMonthYear(mesSelecionado)}.
        </div>
      ) : (
        <div className="space-y-3.5">
          {groupedByPerson.map((group) => {
            const isCollapsed = expandedPersons[group.responsavel.id] === false;

            return (
              <div
                key={group.responsavel.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden transition"
              >
                {/* Group Header */}
                <div
                  onClick={() => toggleExpand(group.responsavel.id)}
                  className="p-4 bg-white border-b border-[#E2E8F0] flex items-center justify-between cursor-pointer select-none hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      className="w-6 h-6 flex items-center justify-center text-[#64748B]"
                      aria-label="Expandir ou recolher"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#17212F]">
                          {group.responsavel.nome}
                        </span>
                        {group.responsavel.is_owner && (
                          <span className="text-[10px] font-semibold text-[#1677E8] bg-[#E8F2FF] px-1.5 py-0.5 rounded">
                            Titular
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        {group.itens.length} {group.itens.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-[#123B67] tabular-nums">
                        {formatCurrency(group.subtotal)}
                      </div>
                      {group.pendente > 0 ? (
                        <span className="text-[10px] font-semibold text-amber-600 block">
                          Pendente: {formatCurrency(group.pendente)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#16A765] block">
                          Quitado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-actions toolbar for this person */}
                {!isCollapsed && (
                  <div className="px-4 py-2 bg-[#E8F2FF]/60 border-b border-[#E2E8F0] flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleSharePersonWhatsApp(group)}
                      className="inline-flex items-center gap-1.5 text-[#1677E8] hover:underline font-semibold cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Enviar Resumo WhatsApp
                    </button>

                    {group.pendente > 0 && !group.responsavel.is_owner && (
                      <button
                        onClick={() =>
                          setSettleShareTarget({
                            respId: group.responsavel.id,
                            cardId: group.itens[0]?.cartao_id || cartoes[0]?.id || '',
                          })
                        }
                        className="inline-flex items-center gap-1 text-[#123B67] hover:underline font-bold cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Quitar Parte
                      </button>
                    )}
                  </div>
                )}

                {/* Items List */}
                {!isCollapsed && (
                  <div className="divide-y divide-[#E2E8F0]">
                    {group.itens.map((p) => {
                      const desp = despesas.find((d) => d.id === p.despesa_id);
                      const card = cartoes.find((c) => c.id === p.cartao_id);

                      return (
                        <div
                          key={p.id}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Toggle paid */}
                            <button
                              onClick={() => togglePagarParcela(p.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#16A765] shrink-0 cursor-pointer"
                              title={p.paga ? 'Marcar como não paga' : 'Marcar como paga'}
                            >
                              {p.paga ? (
                                <CheckCircle className="w-5 h-5 text-[#16A765] fill-[#E8F8F0]" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="font-bold text-[#17212F] truncate text-sm">
                                {desp?.descricao || 'Despesa'}
                              </div>
                              <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 flex-wrap">
                                <span>
                                  {p.numero_parcela}/{p.total_parcelas}
                                </span>
                                <span>·</span>
                                <span>{card?.apelido || card?.nome}</span>
                                <span>·</span>
                                <span>{desp?.categoria}</span>
                                {p.antecipada && (
                                  <span className="text-[10px] bg-[#E8F2FF] text-[#1677E8] px-1.5 py-0.2 rounded font-semibold">
                                    Antecipada
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Value & Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div
                                className={`text-sm font-bold tabular-nums ${
                                  p.paga
                                    ? 'text-[#64748B] line-through'
                                    : 'text-[#17212F]'
                                }`}
                              >
                                {formatCurrency(p.valor)}
                              </div>
                              {p.paga && (
                                <span className="text-[10px] text-[#16A765] font-semibold block">
                                  Pago
                                </span>
                              )}
                            </div>

                            {/* Item Actions */}
                            <div className="flex items-center gap-0.5">
                              {/* Antecipar (only if total installments > 1 and not already paid) */}
                              {p.total_parcelas > 1 && !p.paga && (
                                <button
                                  onClick={() => setAdvancingParcela(p)}
                                  className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#1677E8] hover:bg-slate-100"
                                  title="Antecipar parcela"
                                >
                                  <FastForward className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Edit Despesa */}
                              {desp && (
                                <button
                                  onClick={() => {
                                    setEditingDespesa(desp);
                                    setIsExpenseModalOpen(true);
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-[#1677E8] hover:bg-slate-100"
                                  title="Editar despesa"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Despesa */}
                              {desp && (
                                <button
                                  onClick={() => handleDeleteExpense(desp.id, desp.descricao)}
                                  className="w-7 h-7 flex items-center justify-center rounded text-[#64748B] hover:text-rose-600 hover:bg-slate-100"
                                  title="Excluir compra"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingDespesa(null);
        }}
        editingDespesa={editingDespesa}
      />

      <AdvanceModal
        isOpen={!!advancingParcela}
        onClose={() => setAdvancingParcela(null)}
        parcela={advancingParcela}
        despesa={despesas.find((d) => d.id === advancingParcela?.despesa_id)}
      />

      {settleShareTarget && (
        <SettleShareModal
          isOpen={true}
          onClose={() => setSettleShareTarget(null)}
          responsavelId={settleShareTarget.respId}
          cartaoId={settleShareTarget.cardId}
        />
      )}
    </div>
  );
};
