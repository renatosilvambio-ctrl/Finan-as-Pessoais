import React from 'react';
import { ChevronLeft, ChevronRight, Wallet, CloudCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatMonthYearMedium, addMonths } from '../../utils/dateUtils';

export const Navbar: React.FC = () => {
  const { mesSelecionado, setMesSelecionado, syncStatus, sincronizarComNuvem } = useFinance();

  const handlePrevMonth = () => {
    setMesSelecionado(addMonths(mesSelecionado, -1));
  };

  const handleNextMonth = () => {
    setMesSelecionado(addMonths(mesSelecionado, 1));
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] shadow-xs select-none">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#E8F2FF] text-[#1677E8] flex items-center justify-center shadow-xs">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#1677E8] hidden sm:inline">
            Meu Controle Financeiro
          </span>
          <span className="font-bold text-base tracking-tight text-[#1677E8] sm:hidden">
            ControleFin
          </span>
        </div>

        {/* Center Month Switcher */}
        <div className="flex items-center bg-[#E8F2FF] rounded-xl p-0.5 border border-[#D0E2FF]">
          <button
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[#1677E8] hover:bg-[#D9E9FF] active:scale-95 transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="px-2 sm:px-3 text-center min-w-[95px] sm:min-w-[105px]">
            <span className="text-xs sm:text-sm font-bold text-[#123B67] tracking-tight">
              {formatMonthYearMedium(mesSelecionado)}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[#1677E8] hover:bg-[#D9E9FF] active:scale-95 transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Right Cloud Direct Sync Action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => sincronizarComNuvem()}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
              syncStatus === 'synced'
                ? 'bg-[#E8F8F0] border-[#BBEBD0] text-[#16A765] hover:bg-[#d9f5e5]'
                : syncStatus === 'syncing'
                ? 'bg-[#E8F2FF] border-[#D0E2FF] text-[#1677E8]'
                : syncStatus === 'error'
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-[#F4F7FB] border-[#E2E8F0] text-[#123B67] hover:bg-[#E8F2FF]'
            }`}
            title="Sincronização em Nuvem (Supabase) - Clique para sincronizar"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1677E8]" />
            ) : syncStatus === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <CloudCheck className="w-3.5 h-3.5 text-[#16A765]" />
            )}
            <span className="hidden sm:inline">
              {syncStatus === 'syncing'
                ? 'Sincronizando'
                : syncStatus === 'error'
                ? 'Reconectar'
                : 'Nuvem OK'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
