import React, { useState, useMemo } from 'react';
import { X, CreditCard, Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CategoriaDespesaCartao, DespesaCartao } from '../../types';
import { formatCurrency, splitInstallments, parseCurrency } from '../../utils/currency';
import { addMonths, formatMonthYear, getTodayDate } from '../../utils/dateUtils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDespesa?: DespesaCartao | null;
}

const CATEGORIAS: CategoriaDespesaCartao[] = [
  'Alimentação',
  'Mercado',
  'Eletrônicos',
  'Vestuário',
  'Saúde',
  'Casa',
  'Transporte',
  'Lazer',
  'Educação',
  'Assinatura',
  'Outros',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  editingDespesa,
}) => {
  const {
    responsaveis,
    cartoes,
    mesSelecionado,
    adicionarDespesaCartao,
    editarDespesaCartao,
  } = useFinance();

  const [cartaoId, setCartaoId] = useState<string>(
    editingDespesa?.cartao_id || cartoes[0]?.id || ''
  );
  const [responsavelId, setResponsavelId] = useState<string>(
    editingDespesa?.responsavel_id || responsaveis[0]?.id || ''
  );
  const [descricao, setDescricao] = useState<string>(editingDespesa?.descricao || '');
  const [categoria, setCategoria] = useState<CategoriaDespesaCartao>(
    editingDespesa?.categoria || 'Outros'
  );
  const [valorTotalInput, setValorTotalInput] = useState<string>(
    editingDespesa ? String(editingDespesa.valor_total) : ''
  );
  const [totalParcelas, setTotalParcelas] = useState<number>(
    editingDespesa?.total_parcelas || 1
  );
  const [dataCompra, setDataCompra] = useState<string>(
    editingDespesa?.data_compra || getTodayDate()
  );
  const [primeiroMes, setPrimeiroMes] = useState<string>(
    editingDespesa?.primeiro_mes || mesSelecionado
  );
  const [observacoes, setObservacoes] = useState<string>(
    editingDespesa?.observacoes || ''
  );

  // Sync state if editing changes
  React.useEffect(() => {
    if (editingDespesa) {
      setCartaoId(editingDespesa.cartao_id);
      setResponsavelId(editingDespesa.responsavel_id);
      setDescricao(editingDespesa.descricao);
      setCategoria(editingDespesa.categoria);
      setValorTotalInput(String(editingDespesa.valor_total));
      setTotalParcelas(editingDespesa.total_parcelas);
      setDataCompra(editingDespesa.data_compra);
      setPrimeiroMes(editingDespesa.primeiro_mes);
      setObservacoes(editingDespesa.observacoes || '');
    } else {
      setCartaoId(cartoes[0]?.id || '');
      setResponsavelId(responsaveis[0]?.id || '');
      setDescricao('');
      setCategoria('Alimentação');
      setValorTotalInput('');
      setTotalParcelas(1);
      setDataCompra(getTodayDate());
      setPrimeiroMes(mesSelecionado);
      setObservacoes('');
    }
  }, [editingDespesa, isOpen, cartoes, responsaveis, mesSelecionado]);

  const valorTotalNum = useMemo(() => {
    return parseCurrency(valorTotalInput);
  }, [valorTotalInput]);

  const simulacaoParcelas = useMemo(() => {
    if (valorTotalNum <= 0 || totalParcelas <= 0) return [];
    return splitInstallments(valorTotalNum, totalParcelas);
  }, [valorTotalNum, totalParcelas]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert('Informe a descrição do produto ou serviço.');
      return;
    }
    if (valorTotalNum <= 0) {
      alert('Informe um valor válido.');
      return;
    }
    if (!cartaoId) {
      alert('Selecione um cartão de crédito.');
      return;
    }
    if (!responsavelId) {
      alert('Selecione o responsável pela despesa.');
      return;
    }

    if (editingDespesa) {
      editarDespesaCartao(editingDespesa.id, {
        cartao_id: cartaoId,
        responsavel_id: responsavelId,
        descricao: descricao.trim(),
        categoria,
        observacoes: observacoes.trim() || undefined,
      });
    } else {
      adicionarDespesaCartao({
        cartao_id: cartaoId,
        responsavel_id: responsavelId,
        descricao: descricao.trim(),
        categoria,
        valor_total: valorTotalNum,
        total_parcelas: totalParcelas,
        data_compra: dataCompra,
        primeiro_mes: primeiroMes,
        observacoes: observacoes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between bg-[#F4F7FB] dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1677E8] text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#123B67] dark:text-white">
                {editingDespesa ? 'Editar Despesa do Cartão' : 'Nova Despesa no Cartão'}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Lançamento no cartão compartilhado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-[#E8F2FF] dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
              Produto ou Descrição *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: TV 4K Sala, Pizzaria, Tênis..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
            />
          </div>

          {/* Grid: Responsável e Cartão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Responsável pela Despesa *
              </label>
              <select
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
              >
                {responsaveis.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome} {r.is_owner ? '(Titular)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Cartão de Crédito *
              </label>
              <select
                value={cartaoId}
                onChange={(e) => setCartaoId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
              >
                {cartoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.apelido})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Valor Total e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                disabled={!!editingDespesa}
                placeholder="0,00"
                value={valorTotalInput}
                onChange={(e) => setValorTotalInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-extrabold tabular-nums placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 disabled:opacity-60 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaDespesaCartao)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Parcelas e Primeira Fatura */}
          {!editingDespesa && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                  Parcelas
                </label>
                <select
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
                >
                  <option value={1}>1x (À vista na fatura)</option>
                  {Array.from({ length: 35 }, (_, i) => i + 2).map((n) => (
                    <option key={n} value={n}>
                      {n}x parcelas
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                  Data da Compra
                </label>
                <input
                  type="date"
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                  Primeira Fatura
                </label>
                <input
                  type="month"
                  value={primeiroMes}
                  onChange={(e) => setPrimeiroMes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
                />
              </div>
            </div>
          )}

          {/* Installment Simulation Feedback */}
          {!editingDespesa && valorTotalNum > 0 && totalParcelas > 1 && (
            <div className="p-3.5 rounded-xl bg-[#E8F2FF] dark:bg-blue-950/40 border border-[#BFDBFE] dark:border-blue-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B67] dark:text-blue-300 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#1677E8] dark:text-blue-400" />
                <span>Parcelamento Automático com Ajuste de Centavos:</span>
              </div>
              <div className="text-xs text-[#123B67] dark:text-blue-300">
                {totalParcelas} parcelas de{' '}
                <strong className="tabular-nums text-[#1677E8] font-bold">{formatCurrency(simulacaoParcelas[0])}</strong>
                {simulacaoParcelas[simulacaoParcelas.length - 1] !== simulacaoParcelas[0] && (
                  <span>
                    {' '}(última parcela de {formatCurrency(simulacaoParcelas[simulacaoParcelas.length - 1])})
                  </span>
                )}
                <div className="text-[11px] opacity-80 mt-1">
                  Vencimento de {formatMonthYear(primeiroMes)} até{' '}
                  {formatMonthYear(addMonths(primeiroMes, totalParcelas - 1))}
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Presente de aniversário, compra compartilhada..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-[#E8F2FF] dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1677E8] hover:bg-[#1265c7] text-white shadow-md active:scale-95 transition"
            >
              {editingDespesa ? 'Salvar Alterações' : 'Cadastrar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
