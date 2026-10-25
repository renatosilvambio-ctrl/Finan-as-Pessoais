import React from 'react';
import { CreditCard, ArrowDownLeft, ArrowUpRight, CheckCircle2, X } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'despesa' | 'receber' | 'pagar' | 'quitar') => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'despesa' as const,
      title: 'Nova despesa do cartão',
      desc: 'Compra à vista ou parcelada no cartão compartilhado',
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    },
    {
      id: 'receber' as const,
      title: 'Nova conta a receber',
      desc: 'Salário, 5º dia útil, vale ou dívida de terceiros',
      icon: ArrowDownLeft,
      color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    },
    {
      id: 'pagar' as const,
      title: 'Nova conta a pagar',
      desc: 'Aluguel, energia, internet, contas fixas e variáveis',
      icon: ArrowUpRight,
      color: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    },
    {
      id: 'quitar' as const,
      title: 'Quitar fatura de responsável',
      desc: 'Registrar reembolso ou pagamento de terceiro no cartão',
      icon: CheckCircle2,
      color: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle for Mobile */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="p-5 pb-4 flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-[#123B67] dark:text-white">Novo Lançamento</h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Escolha o tipo de operação financeira
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-[#E8F2FF] dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 pb-8 sm:pb-5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${act.color}`}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 shadow-xs shrink-0">
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold tracking-tight">{act.title}</div>
                  <div className="text-xs opacity-80 truncate">{act.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
