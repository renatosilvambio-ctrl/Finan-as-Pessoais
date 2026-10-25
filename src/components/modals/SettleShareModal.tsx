import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/currency';
import { formatMonthYear } from '../../utils/dateUtils';

interface SettleShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  responsavelId: string;
  cartaoId: string;
}

export const SettleShareModal: React.FC<SettleShareModalProps> = ({
  isOpen,
  onClose,
  responsavelId,
  cartaoId,
}) => {
  const {
    mesSelecionado,
    responsaveis,
    cartoes,
    parcelas,
    quitarFaturaResponsavel,
  } = useFinance();

  const responsavel = responsaveis.find((r) => r.id === responsavelId);
  const cartao = cartoes.find((c) => c.id === cartaoId);

  const parcelasPessoa = parcelas.filter(
    (p) =>
      p.responsavel_id === responsavelId &&
      p.cartao_id === cartaoId &&
      p.mes_fatura === mesSelecionado
  );

  const totalDevido = parcelasPessoa.reduce((sum, p) => sum + p.valor, 0);
  const totalPago = parcelasPessoa.filter((p) => p.paga).reduce((sum, p) => sum + p.valor, 0);
  const totalPendente = totalDevido - totalPago;

  const [valorPagoInput, setValorPagoInput] = useState<string>(
    String(totalPendente > 0 ? totalPendente : totalDevido)
  );

  React.useEffect(() => {
    setValorPagoInput(String(totalPendente > 0 ? totalPendente : totalDevido));
  }, [totalPendente, totalDevido]);

  if (!isOpen || !responsavel || !cartao) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    quitarFaturaResponsavel(responsavelId, cartaoId, mesSelecionado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
          <div className="flex items-center gap-2 text-[#16A765]">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-[#123B67] dark:text-white">
              Quitar Parte de {responsavel.nome}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="py-4 space-y-3">
          <div className="p-3 bg-[#E8F8F0] dark:bg-emerald-950/40 rounded-xl border border-[#BBEBD0] dark:border-emerald-800/60 text-xs text-[#123B67] dark:text-emerald-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Cartão:</span>
              <strong className="text-right text-[#17212F] dark:text-white">{cartao.nome}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Fatura:</span>
              <strong className="text-[#17212F] dark:text-white">{formatMonthYear(mesSelecionado)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Total Devido:</span>
              <strong className="tabular-nums text-[#17212F] dark:text-white">{formatCurrency(totalDevido)}</strong>
            </div>
            <div className="flex justify-between text-[#16A765] dark:text-emerald-300 font-bold border-t border-[#BBEBD0] pt-1 mt-1">
              <span>Saldo Pendente:</span>
              <strong className="tabular-nums">{formatCurrency(totalPendente)}</strong>
            </div>
          </div>

          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Ao confirmar, todas as compras do responsável na fatura de{' '}
            <strong className="text-[#123B67] dark:text-white">{formatMonthYear(mesSelecionado)}</strong> serão marcadas como quitadas e o valor será reconciliado.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#E8F2FF] rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-[#1677E8] hover:bg-[#1265c7] text-white rounded-lg shadow-sm transition"
            >
              Confirmar Quitação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
