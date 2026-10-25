import React, { useState } from 'react';
import { X, FastForward } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ParcelaCartao, DespesaCartao } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatMonthYear } from '../../utils/dateUtils';

interface AdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: ParcelaCartao | null;
  despesa?: DespesaCartao;
}

export const AdvanceModal: React.FC<AdvanceModalProps> = ({
  isOpen,
  onClose,
  parcela,
  despesa,
}) => {
  const { mesSelecionado, anteciparParcela } = useFinance();
  const [destinoMes, setDestinoMes] = useState(mesSelecionado);

  if (!isOpen || !parcela) return null;

  const handleConfirm = () => {
    anteciparParcela(parcela.id, destinoMes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
          <div className="flex items-center gap-2 text-[#1677E8]">
            <FastForward className="w-5 h-5" />
            <h3 className="font-bold text-base text-[#123B67] dark:text-white">
              Antecipar Parcela
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <p className="text-xs text-[#64748B] dark:text-slate-300">
            Você está antecipando a parcela <strong>{parcela.numero_parcela}/{parcela.total_parcelas}</strong> de{' '}
            <strong className="text-[#1677E8]">{formatCurrency(parcela.valor)}</strong> da compra{' '}
            <strong className="text-[#123B67] dark:text-white">"{despesa?.descricao || 'Despesa'}"</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
              Trazer esta parcela para a fatura de:
            </label>
            <input
              type="month"
              value={destinoMes}
              onChange={(e) => setDestinoMes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#123B67] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
            />
          </div>

          <div className="text-[11px] text-[#64748B] bg-[#F4F7FB] dark:bg-slate-800/50 p-2.5 rounded-lg border border-[#E2E8F0] dark:border-slate-800">
            A parcela deixará o mês de <strong>{formatMonthYear(parcela.mes_fatura)}</strong> e será cobrada em{' '}
            <strong>{formatMonthYear(destinoMes)}</strong>.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#E8F2FF] rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold bg-[#1677E8] hover:bg-[#1265c7] text-white rounded-lg shadow-sm transition"
          >
            Confirmar Antecipação
          </button>
        </div>
      </div>
    </div>
  );
};
