import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CategoriaContaPagar, StatusContaPagar, ContaPagar } from '../../types';
import { parseCurrency } from '../../utils/currency';
import { getTodayDate } from '../../utils/dateUtils';

interface PayableModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingConta?: ContaPagar | null;
}

const CATEGORIAS: CategoriaContaPagar[] = [
  'Aluguel',
  'Condomínio',
  'Energia',
  'Água',
  'Internet',
  'Celular',
  'Seguro',
  'Financiamento',
  'Assinaturas',
  'Supermercado',
  'Saúde',
  'Dívidas',
  'Outros',
];

export const PayableModal: React.FC<PayableModalProps> = ({
  isOpen,
  onClose,
  editingConta,
}) => {
  const { mesSelecionado, adicionarContaPagar, atualizarContaPagar } = useFinance();

  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<CategoriaContaPagar>('Aluguel');
  const [valorInput, setValorInput] = useState('');
  const [dataVencimento, setDataVencimento] = useState(getTodayDate());
  const [mesCompetencia, setMesCompetencia] = useState(mesSelecionado);
  const [recorrencia, setRecorrencia] = useState<'nenhuma' | 'mensal'>('mensal');
  const [status, setStatus] = useState<StatusContaPagar>('pendente');
  const [valorPagoInput, setValorPagoInput] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingConta) {
      setDescricao(editingConta.descricao);
      setCategoria(editingConta.categoria);
      setValorInput(String(editingConta.valor));
      setDataVencimento(editingConta.data_vencimento);
      setMesCompetencia(editingConta.mes_competencia);
      setRecorrencia(editingConta.recorrencia);
      setStatus(editingConta.status);
      setValorPagoInput(String(editingConta.valor_pago || 0));
      setObservacoes(editingConta.observacoes || '');
    } else {
      setDescricao('');
      setCategoria('Energia');
      setValorInput('');
      setDataVencimento(`${mesSelecionado}-10`);
      setMesCompetencia(mesSelecionado);
      setRecorrencia('mensal');
      setStatus('pendente');
      setValorPagoInput('0');
      setObservacoes('');
    }
  }, [editingConta, isOpen, mesSelecionado]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseCurrency(valorInput);
    if (!descricao.trim()) {
      alert('Informe a descrição da conta a pagar.');
      return;
    }
    if (val <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    const valorPago = parseCurrency(valorPagoInput);

    if (editingConta) {
      atualizarContaPagar(editingConta.id, {
        descricao: descricao.trim(),
        categoria,
        valor: val,
        data_vencimento: dataVencimento,
        mes_competencia: mesCompetencia,
        recorrencia,
        status,
        valor_pago: status === 'pago' ? val : valorPago,
        data_pagamento: status === 'pago' ? getTodayDate() : undefined,
        observacoes: observacoes.trim() || undefined,
      });
    } else {
      adicionarContaPagar({
        descricao: descricao.trim(),
        categoria,
        valor: val,
        data_vencimento: dataVencimento,
        mes_competencia: mesCompetencia,
        recorrencia,
        status,
        valor_pago: status === 'pago' ? val : valorPago,
        data_pagamento: status === 'pago' ? getTodayDate() : undefined,
        observacoes: observacoes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between bg-[#F4F7FB] dark:bg-rose-950/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#123B67] dark:text-white">
                {editingConta ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Despesas pessoais fixas ou variáveis fora do cartão
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel, Energia Enel, Internet Fibra..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
            />
          </div>

          {/* Categoria e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaContaPagar)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Valor da Conta (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-extrabold tabular-nums placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
              />
            </div>
          </div>

          {/* Vencimento e Mês de Competência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Mês de Competência
              </label>
              <input
                type="month"
                value={mesCompetencia}
                onChange={(e) => setMesCompetencia(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
              />
            </div>
          </div>

          {/* Recorrência e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Recorrência
              </label>
              <select
                value={recorrencia}
                onChange={(e) => setRecorrencia(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
              >
                <option value="mensal">Conta Fixa Mensal (Todo Mês)</option>
                <option value="nenhuma">Lançamento Único</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Status do Pagamento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusContaPagar)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Já Pago</option>
                <option value="parcial">Parcialmente Pago</option>
                <option value="atrasado">Em Atraso</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Débito automático, código de barras..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 transition"
            >
              {editingConta ? 'Salvar Alterações' : 'Salvar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
