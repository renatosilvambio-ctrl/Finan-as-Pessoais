import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Menu,
  Plus,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { TabNavegacao } from '../../types';

interface BottomNavProps {
  onOpenQuickAction: () => void;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({ onOpenQuickAction }) => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems: { id: TabNavegacao; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'inicio', label: 'Início', icon: LayoutDashboard },
    { id: 'cartao', label: 'Cartão', icon: CreditCard },
    { id: 'receber', label: 'A Receber', icon: ArrowDownLeft },
    { id: 'contas', label: 'Contas', icon: ArrowUpRight },
    { id: 'mais', label: 'Mais', icon: Menu },
  ];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed right-4 bottom-20 z-40 md:right-8 md:bottom-24">
        <button
          onClick={onOpenQuickAction}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1677E8] text-white shadow-xl hover:bg-[#1265c7] active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#1677E8]/30 shadow-blue-500/25"
          aria-label="Adicionar novo lançamento"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom Bar */}
      <nav
        aria-label="Navegação Principal"
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] pb-safe shadow-lg"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'text-[#1677E8]'
                    : 'text-[#64748B] hover:text-[#17212F]'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors ${
                    isActive ? 'bg-[#E8F2FF] text-[#1677E8]' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>
                <span
                  className={`text-[11px] tracking-tight mt-0.5 ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
