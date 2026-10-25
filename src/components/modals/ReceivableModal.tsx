import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, Calendar } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CategoriaRecebimento, StatusRecebimento, ContaReceber } from '../../types';
import { parseCurrency } from '../../utils/currency';
import { getTodayDate, getQuintoDiaUtil } from '../../utils/dateUtils';

interface ReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingConta?: ContaReceber | null;
}

const CATEGORIAS: CategoriaRecebimento[] = [
  'Salário',
  'Vale / Adiantamento',
  'Dívida de Terceiros',
  'Empréstimo',
  'Reembolso',
  'Venda',
  'Outros',
];

export const ReceivableModal: React.FC<ReceivableModalProps> = ({
  isOpen,
  onClose,
  editingConta,
}) => {
  const { mesSelecionado, adicionarContaReceber, atualizarContaReceber } = useFinance();

  const [descricao, setDescricao] = useState('');
  const [pagadorNome, setPagadorNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaRecebimento>('Salário');
  const [valorInput, setValorInput] = useState('');
  const [recorrencia, setRecorrencia] = useState<'nenhuma' | 'mensal_fixo' | 'quinto_dia_util'>('nenhuma');
  const [diaFixo, setDiaFixo] = useState<number>(5);
  const [dataPrevista, setDataPrevista] = useState(getTodayDate());
  const [mesCompetencia, setMesCompetencia] = useState(mesSelecionado);
  const [isDividaParcelada, setIsDividaParcelada] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState(10);
  const [status, setStatus] = useState<StatusRecebimento>('a_receber');
  const [valorRecebidoInput, setValorRecebidoInput] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingConta) {
      setDescricao(editingConta.descricao);
      setPagadorNome(editingConta.pagador_nome);
      setCategoria(editingConta.categoria);
      setValorInput(String(editingConta.valor));
      setRecorrencia(editingConta.recorrencia);
      setDiaFixo(editingConta.dia_fixo || 5);
      setDataPrevista(editingConta.data_prevista);
      setMesCompetencia(editingConta.mes_competencia);
      setIsDividaParcelada(!!editingConta.total_parcelas && editingConta.total_parcelas > 1);
      setTotalParcelas(editingConta.total_parcelas || 10);
      setStatus(editingConta.status);
      setValorRecebidoInput(String(editingConta.valor_recebido || 0));
      setObservacoes(editingConta.observacoes || '');
    } else {
      setDescricao('');
      setPagadorNome('');
      setCategoria('Salário');
      setValorInput('');
      setRecorrencia('nenhuma');
      setDiaFixo(5);
      setDataPrevista(`${mesSelecionado}-05`);
      setMesCompetencia(mesSelecionado);
      setIsDividaParcelada(false);
      setTotalParcelas(10);
      setStatus('a_receber');
      setValorRecebidoInput('0');
      setObservacoes('');
    }
  }, [editingConta, isOpen, mesSelecionado]);

  // If user chooses 5th business day recurrence, calculate date
  const handleRecorrenciaChange = (rec: 'nenhuma' | 'mensal_fixo' | 'quinto_dia_util') => {
    setRecorrencia(rec);
    if (rec === 'quinto_dia_util') {
      setDataPrevista(getQuintoDiaUtil(mesCompetencia));
    } else if (rec === 'mensal_fixo') {
      const day = String(diaFixo).padStart(2, '0');
      setDataPrevista(`${mesCompetencia}-${day}`);
    }
  };

  const handleMesCompetenciaChange = (newMes: string) => {
    setMesCompetencia(newMes);
    if (recorrencia === 'quinto_dia_util') {
      setDataPrevista(getQuintoDiaUtil(newMes));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseCurrency(valorInput);
    if (!descricao.trim()) {
      alert('Informe a descrição do recebimento.');
      return;
    }
    if (val <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    const valorRecebido = parseCurrency(valorRecebidoInput);

    if (editingConta) {
      atualizarContaReceber(editingConta.id, {
        descricao: descricao.trim(),
        pagador_nome: pagadorNome.trim() || 'Fonte Pagadora',
        categoria,
        valor: val,
        data_prevista: dataPrevista,
        mes_competencia: mesCompetencia,
        recorrencia,
        dia_fixo: recorrencia === 'mensal_fixo' ? diaFixo : undefined,
        status,
        valor_recebido: status === 'recebido' ? val : valorRecebido,
        data_recebimento: status === 'recebido' ? getTodayDate() : undefined,
        observacoes: observacoes.trim() || undefined,
      });
    } else {
      adicionarContaReceber(
        {
          descricao: descricao.trim(),
          pagador_nome: pagadorNome.trim() || 'Fonte Pagadora',
          categoria,
          valor: val,
          data_prevista: dataPrevista,
          mes_competencia: mesCompetencia,
          recorrencia,
          dia_fixo: recorrencia === 'mensal_fixo' ? diaFixo : undefined,
          total_parcelas: isDividaParcelada ? totalParcelas : undefined,
          status,
          valor_recebido: status === 'recebido' ? val : valorRecebido,
          data_recebimento: status === 'recebido' ? getTodayDate() : undefined,
          observacoes: observacoes.trim() || undefined,
        },
        isDividaParcelada
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between bg-[#F4F7FB] dark:bg-blue-950/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1677E8] text-white flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#123B67] dark:text-white">
                {editingConta ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Salários, vales, adiantamentos e dívidas a receber
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição do Recebimento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Salário Mensal, Vale, Dívida do Carlos..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Pagador e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pagador / Devedor
              </label>
              <input
                type="text"
                placeholder="Ex: Empresa, Carlos, etc."
                value={pagadorNome}
                onChange={(e) => setPagadorNome(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaRecebimento)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Valor e Data Prevista */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isDividaParcelada ? 'Valor Total da Dívida (R$) *' : 'Valor Previsto (R$) *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Prevista
              </label>
              <input
                type="date"
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Mês de Competência e Recorrência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mês de Competência
              </label>
              <input
                type="month"
                value={mesCompetencia}
                onChange={(e) => handleMesCompetenciaChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Recorrência
              </label>
              <select
                value={recorrencia}
                onChange={(e) => handleRecorrenciaChange(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="nenhuma">Lançamento Avulso</option>
                <option value="quinto_dia_util">5º Dia Útil (Automático Brasil)</option>
                <option value="mensal_fixo">Todo Mês (Dia Fixo)</option>
              </select>
            </div>
          </div>

          {/* Info for 5th business day */}
          {recorrencia === 'quinto_dia_util' && (
            <div className="p-3 rounded-xl bg-[#E8F2FF] dark:bg-blue-950/40 border border-[#BFDBFE] dark:border-blue-800 text-xs text-[#123B67] dark:text-blue-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1677E8] shrink-0" />
              <span>
                Calculado automaticamente desconsiderando fins de semana e feriados nacionais. Data prevista:{' '}
                <strong>{dataPrevista}</strong>.
              </span>
            </div>
          )}

          {/* Dívida parcelada toggle */}
          {!editingConta && (
            <div className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/30">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDividaParcelada}
                  onChange={(e) => setIsDividaParcelada(e.target.checked)}
                  className="w-4 h-4 text-[#1677E8] rounded focus:ring-[#1677E8]"
                />
                <span className="text-xs font-semibold text-[#123B67] dark:text-slate-200">
                  Dívida parcelada de terceiro (Ex: 10 parcelas mensais de R$ 500)
                </span>
              </label>

              {isDividaParcelada && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-[#64748B] dark:text-slate-400">
                    Número de parcelas:
                  </span>
                  <select
                    value={totalParcelas}
                    onChange={(e) => setTotalParcelas(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-[#123B67]"
                  >
                    {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36].map((n) => (
                      <option key={n} value={n}>
                        {n} parcelas
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Status & Valor Recebido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusRecebimento)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
              >
                <option value="a_receber">A Receber</option>
                <option value="recebido">Recebido Integralmente</option>
                <option value="parcial">Parcialmente Recebido</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {status === 'parcial' && (
              <div>
                <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
                  Valor já Recebido (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorRecebidoInput}
                  onChange={(e) => setValorRecebidoInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Acordo verbal, recibo pendente..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
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
              {editingConta ? 'Salvar Alterações' : 'Salvar Recebimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
